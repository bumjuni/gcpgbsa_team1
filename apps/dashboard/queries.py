import pandas as pd
from sqlalchemy import text

DATE_PARAMS = {}


def _read_sql(engine, sql: str, params: dict) -> pd.DataFrame:
    return pd.read_sql(text(sql), engine, params=params)


# ── A. 온보딩/가입 퍼널 ────────────────────────────────────────────


def signup_trend(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT DATE(created_at) AS day, COUNT(*) AS signups
        FROM instructor
        WHERE deleted_at IS NULL
          AND DATE(created_at) BETWEEN :start_date AND :end_date
        GROUP BY DATE(created_at)
        ORDER BY day
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})


def consent_rates(engine) -> pd.DataFrame:
    sql = """
        SELECT
            COUNT(*) AS total,
            SUM(terms_agreed) AS terms_agreed,
            SUM(privacy_agreed) AS privacy_agreed,
            SUM(marketing_agreed) AS marketing_agreed
        FROM instructor
        WHERE deleted_at IS NULL
    """
    return _read_sql(engine, sql, {})


def onboarding_funnel(engine) -> pd.DataFrame:
    sql = """
        SELECT
            (SELECT COUNT(*) FROM instructor WHERE deleted_at IS NULL) AS signed_up,
            (SELECT COUNT(DISTINCT i.id)
               FROM instructor i
               JOIN swim_class c ON c.instructor_id = i.id AND c.deleted_at IS NULL
              WHERE i.deleted_at IS NULL) AS created_classroom,
            (SELECT COUNT(DISTINCT i.id)
               FROM instructor i
               JOIN swim_class c ON c.instructor_id = i.id AND c.deleted_at IS NULL
               JOIN program p ON p.class_id = c.id AND p.deleted_at IS NULL
              WHERE i.deleted_at IS NULL) AS created_program
    """
    return _read_sql(engine, sql, {})


# ── B. 핵심 기능 사용 현황 ──────────────────────────────────────────


def feature_usage_trend(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT DATE(created_at) AS day, 'program' AS entity, COUNT(*) AS count
        FROM program
        WHERE deleted_at IS NULL AND DATE(created_at) BETWEEN :start_date AND :end_date
        GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 'classroom' AS entity, COUNT(*) AS count
        FROM swim_class
        WHERE deleted_at IS NULL AND DATE(created_at) BETWEEN :start_date AND :end_date
        GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 'student' AS entity, COUNT(*) AS count
        FROM student
        WHERE deleted_at IS NULL AND DATE(created_at) BETWEEN :start_date AND :end_date
        GROUP BY DATE(created_at)
        ORDER BY day
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})


def top_instructors(engine, start_date, end_date, limit: int = 10) -> pd.DataFrame:
    sql = """
        SELECT i.name AS instructor_name, COUNT(*) AS programs_created
        FROM program p
        JOIN swim_class c ON c.id = p.class_id AND c.deleted_at IS NULL
        JOIN instructor i ON i.id = c.instructor_id AND i.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND DATE(p.created_at) BETWEEN :start_date AND :end_date
        GROUP BY i.id, i.name
        ORDER BY programs_created DESC
        LIMIT :limit
    """
    return _read_sql(
        engine, sql, {"start_date": start_date, "end_date": end_date, "limit": limit}
    )


def classroom_distribution(engine) -> dict:
    by_level = _read_sql(
        engine,
        "SELECT level, COUNT(*) AS count FROM swim_class WHERE deleted_at IS NULL GROUP BY level",
        {},
    )
    by_age_group = _read_sql(
        engine,
        "SELECT age_group, COUNT(*) AS count FROM swim_class WHERE deleted_at IS NULL GROUP BY age_group",
        {},
    )
    by_goal = _read_sql(
        engine,
        "SELECT goals, COUNT(*) AS count FROM swim_class WHERE deleted_at IS NULL GROUP BY goals",
        {},
    )
    return {"level": by_level, "age_group": by_age_group, "goal": by_goal}


def program_status_distribution(engine) -> pd.DataFrame:
    sql = """
        SELECT status, COUNT(*) AS count
        FROM program
        WHERE deleted_at IS NULL
        GROUP BY status
    """
    return _read_sql(engine, sql, {})


# ── C. LLM/RAG 품질·비용 ───────────────────────────────────────────


def generation_success_rate(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT success, COUNT(*) AS count
        FROM program_generation_log
        WHERE DATE(requested_at) BETWEEN :start_date AND :end_date
        GROUP BY success
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})


def failure_reasons(engine, start_date, end_date, limit: int = 10) -> pd.DataFrame:
    sql = """
        SELECT error_message, COUNT(*) AS count
        FROM program_generation_log
        WHERE success = FALSE
          AND DATE(requested_at) BETWEEN :start_date AND :end_date
        GROUP BY error_message
        ORDER BY count DESC
        LIMIT :limit
    """
    return _read_sql(
        engine, sql, {"start_date": start_date, "end_date": end_date, "limit": limit}
    )


def latency_trend(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT
            DATE(requested_at) AS day,
            AVG(duration_ms) AS avg_ms,
            MAX(duration_ms) AS max_ms
        FROM program_generation_log
        WHERE success = TRUE
          AND DATE(requested_at) BETWEEN :start_date AND :end_date
        GROUP BY DATE(requested_at)
        ORDER BY day
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})


def token_usage_coverage(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT COUNT(*) AS total, COUNT(prompt_tokens) AS with_token_data
        FROM program_generation_log
        WHERE DATE(requested_at) BETWEEN :start_date AND :end_date
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})


def feedback_stats(engine, start_date, end_date) -> pd.DataFrame:
    sql = """
        SELECT feedback_rating, feedback_memo, date, created_at
        FROM program
        WHERE deleted_at IS NULL
          AND feedback_rating IS NOT NULL
          AND DATE(created_at) BETWEEN :start_date AND :end_date
        ORDER BY created_at DESC
    """
    return _read_sql(engine, sql, {"start_date": start_date, "end_date": end_date})
