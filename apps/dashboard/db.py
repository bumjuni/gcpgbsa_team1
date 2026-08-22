import os

import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine, event

load_dotenv()


def _database_url() -> str:
    user = os.environ["DB_USER"]
    password = os.environ["DB_PASSWORD"]
    host = os.environ["DB_HOST"]
    port = os.environ.get("DB_PORT", "3306")
    name = os.environ["DB_NAME"]
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


@st.cache_resource
def get_engine():
    engine = create_engine(_database_url(), pool_pre_ping=True)

    @event.listens_for(engine, "connect")
    def _enforce_read_only(dbapi_connection, connection_record):
        # 방어적 안전장치: 계정 권한 설정과 무관하게 세션 단위로 쓰기를 막는다.
        with dbapi_connection.cursor() as cursor:
            cursor.execute("SET SESSION TRANSACTION READ ONLY")

    return engine
