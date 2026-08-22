import os
from datetime import date, timedelta

import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv

import queries
from db import get_engine

load_dotenv()

st.set_page_config(page_title="Growdy 베타테스트 대시보드", layout="wide")


def _check_password() -> bool:
    if st.session_state.get("authenticated"):
        return True

    expected = os.environ.get("DASHBOARD_PASSWORD")
    if not expected:
        st.error("DASHBOARD_PASSWORD가 설정되지 않았습니다. .env를 확인하세요.")
        st.stop()

    with st.form("login"):
        password = st.text_input("비밀번호", type="password")
        submitted = st.form_submit_button("입장")
    if submitted:
        if password == expected:
            st.session_state["authenticated"] = True
            st.rerun()
        else:
            st.error("비밀번호가 올바르지 않습니다.")
    return False


if not _check_password():
    st.stop()

engine = get_engine()

st.title("Growdy 베타테스트 대시보드")

with st.sidebar:
    st.header("기간 필터")
    default_start = date.today() - timedelta(days=30)
    start_date, end_date = st.date_input(
        "조회 기간",
        value=(default_start, date.today()),
    )
    if st.button("로그아웃"):
        st.session_state["authenticated"] = False
        st.rerun()

tab_onboarding, tab_usage, tab_llm = st.tabs(
    ["온보딩/가입 퍼널", "핵심 기능 사용 현황", "LLM/RAG 품질·비용"]
)


with tab_onboarding:
    st.subheader("가입 추이")
    signup_df = queries.signup_trend(engine, start_date, end_date)
    if signup_df.empty:
        st.info("해당 기간에 가입 데이터가 없습니다.")
    else:
        st.plotly_chart(
            px.line(signup_df, x="day", y="signups", markers=True),
            use_container_width=True,
        )

    st.subheader("약관/개인정보/마케팅 동의율")
    consent_df = queries.consent_rates(engine)
    if consent_df.empty or consent_df.loc[0, "total"] == 0:
        st.info("가입 강사가 없습니다.")
    else:
        row = consent_df.loc[0]
        total = row["total"]
        col1, col2, col3 = st.columns(3)
        col1.metric("이용약관 동의율", f"{row['terms_agreed'] / total:.0%}")
        col2.metric("개인정보 동의율", f"{row['privacy_agreed'] / total:.0%}")
        col3.metric("마케팅 동의율", f"{row['marketing_agreed'] / total:.0%}")

    st.subheader("이탈 퍼널: 가입 → 반 생성 → 수업안 생성")
    funnel_df = queries.onboarding_funnel(engine)
    if not funnel_df.empty:
        row = funnel_df.loc[0]
        funnel_data = pd.DataFrame(
            {
                "단계": ["가입", "반 생성", "수업안 생성"],
                "강사 수": [
                    row["signed_up"],
                    row["created_classroom"],
                    row["created_program"],
                ],
            }
        )
        st.plotly_chart(
            px.funnel(funnel_data, x="강사 수", y="단계"), use_container_width=True
        )


with tab_usage:
    st.subheader("기간별 기능 사용 추이")
    usage_df = queries.feature_usage_trend(engine, start_date, end_date)
    if usage_df.empty:
        st.info("해당 기간에 사용 데이터가 없습니다.")
    else:
        st.plotly_chart(
            px.line(usage_df, x="day", y="count", color="entity", markers=True),
            use_container_width=True,
        )

    st.subheader("강사별 수업안 생성 랭킹 (Top 10)")
    top_df = queries.top_instructors(engine, start_date, end_date)
    if top_df.empty:
        st.info("해당 기간에 생성된 수업안이 없습니다.")
    else:
        st.dataframe(top_df, use_container_width=True, hide_index=True)

    st.subheader("반 속성 분포")
    dist = queries.classroom_distribution(engine)
    col1, col2, col3 = st.columns(3)
    with col1:
        st.caption("레벨별")
        st.plotly_chart(
            px.bar(dist["level"], x="level", y="count"), use_container_width=True
        )
    with col2:
        st.caption("연령대별")
        st.plotly_chart(
            px.bar(dist["age_group"], x="age_group", y="count"),
            use_container_width=True,
        )
    with col3:
        st.caption("목표별")
        st.plotly_chart(
            px.bar(dist["goal"], x="goals", y="count"), use_container_width=True
        )

    st.subheader("수업안 상태 분포")
    status_df = queries.program_status_distribution(engine)
    if not status_df.empty:
        st.plotly_chart(
            px.pie(status_df, names="status", values="count"),
            use_container_width=True,
        )


with tab_llm:
    st.subheader("생성 성공률")
    success_df = queries.generation_success_rate(engine, start_date, end_date)
    if success_df.empty:
        st.info("해당 기간에 생성 시도 기록이 없습니다.")
    else:
        success_df["결과"] = success_df["success"].map({1: "성공", 0: "실패"})
        total = success_df["count"].sum()
        success_count = success_df.loc[success_df["success"] == 1, "count"].sum()
        st.metric("성공률", f"{success_count / total:.1%}", f"{total}건 중 {success_count}건")
        st.plotly_chart(
            px.pie(success_df, names="결과", values="count"), use_container_width=True
        )

    st.subheader("실패 사유 Top 10")
    failure_df = queries.failure_reasons(engine, start_date, end_date)
    if failure_df.empty:
        st.info("해당 기간에 실패 기록이 없습니다.")
    else:
        st.dataframe(failure_df, use_container_width=True, hide_index=True)

    st.subheader("응답 지연시간 추이 (성공 건 기준)")
    latency_df = queries.latency_trend(engine, start_date, end_date)
    if latency_df.empty:
        st.info("해당 기간에 지연시간 데이터가 없습니다.")
    else:
        st.plotly_chart(
            px.line(latency_df, x="day", y=["avg_ms", "max_ms"], markers=True),
            use_container_width=True,
        )

    st.subheader("토큰 사용량 / 비용")
    coverage_df = queries.token_usage_coverage(engine, start_date, end_date)
    if not coverage_df.empty and coverage_df.loc[0, "with_token_data"] == 0:
        st.info("현재 토큰 사용량 데이터가 기록되지 않고 있습니다 (추후 계측 예정).")
    else:
        st.dataframe(coverage_df, use_container_width=True, hide_index=True)

    st.subheader("강사 피드백")
    feedback_df = queries.feedback_stats(engine, start_date, end_date)
    if feedback_df.empty:
        st.info("해당 기간에 피드백이 없습니다.")
    else:
        st.metric("평균 평점", f"{feedback_df['feedback_rating'].mean():.1f} / 5")
        st.plotly_chart(
            px.histogram(feedback_df, x="feedback_rating", nbins=5),
            use_container_width=True,
        )
        st.dataframe(
            feedback_df[["date", "feedback_rating", "feedback_memo"]],
            use_container_width=True,
            hide_index=True,
        )
