import os
import glob
from dotenv import load_dotenv  # ★ 추가된 부분: .env 파일을 읽어오기 위한 모듈
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_community.vectorstores import Chroma

# ★ 추가된 부분: .env 파일 안의 비밀 정보를 불러옵니다.
load_dotenv()

# =====================================================================
# 1. 구글 클라우드(GCP) 프로젝트 ID 설정 (구글 크레딧이 있는 프로젝트)
# =====================================================================
# ★ .env 파일에서 프로젝트 ID를 안전하게 가져오도록 변경되었습니다!
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID  # <-- 에러가 났던 오타 수정 완료!
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"    # 서울 리전 설정 (속도 최적화)

# =====================================================================
# 2. 여러 폴더 안의 모든 TXT 파일 한 번에 불러오기
# =====================================================================
# ★ 읽어올 폴더 이름들을 리스트( [ ... ] ) 안에 쉼표로 나열하세요!
folder_paths = ["Basic_Tech", "Drills", "YouTube"]

documents = []
total_file_count = 0

for folder_path in folder_paths:
    # 각 폴더 안에 있는 .txt 파일 경로들을 찾음
    txt_files = glob.glob(os.path.join(folder_path, "*.txt"))
    print(
        f"📂 '{folder_path}' 폴더에서 총 {len(txt_files)}개의 TXT 파일을"
        " 발견했습니다!"
    )
    total_file_count += len(txt_files)

    for file_path in txt_files:
        try:
            # 1차 시도: utf-8 인코딩으로 로드
            loader = TextLoader(file_path, encoding="utf-8")
            documents.extend(loader.load())
        except UnicodeDecodeError:
            # 2차 시도: 윈도우 한글(cp949) 인코딩으로 로드
            loader = TextLoader(file_path, encoding="cp949")
            documents.extend(loader.load())

print(
    f"✅ 모든 폴더 문서 로딩 완료! (총 {len(documents)}/{total_file_count}개"
    " 파일의 텍스트 로드 성공)\n"
)

# =====================================================================
# 3. 문서 조각내기 (Chunking)
# =====================================================================
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)

chunks = text_splitter.split_documents(documents)
print(f"✅ 청킹 완료! 문서가 총 [{len(chunks)}개]의 의미 조각(Chunk)으로 분할되었습니다.\n")

# =====================================================================
# 4. [구글 크레딧 사용] Vertex AI 임베딩 & 디스크 영구 저장
# =====================================================================
print("⏳ TXT 파일 벡터화 및 하드디스크('./my_rag_db') 저장 중...")

embedding_model = VertexAIEmbeddings(
    model_name="text-multilingual-embedding-002",
    project=GCP_PROJECT_ID,
    location="asia-northeast3"
)

# ★ 핵심: 컴퓨터 폴더에 영구 보관할 경로
DB_PATH = "./my_rag_db"
batch_size = 30
vector_db = None

# 30개씩 안전하게 밀어넣기
for i in range(0, len(chunks), batch_size):
    batch_chunks = chunks[i : i + batch_size]
    print(f"   ▶ TXT {i + 1} ~ {min(i + batch_size, len(chunks))}번째 조각 저장 중...")
    
    if vector_db is None:
        vector_db = Chroma.from_documents(
            documents=batch_chunks,
            embedding=embedding_model,
            collection_name="real_txt_data",  # <-- TXT 전용 방 이름
            persist_directory=DB_PATH         # <-- ★ 하드디스크 영구 저장 필수 옵션!
        )
    else:
        vector_db.add_documents(batch_chunks)

print(f"✅ TXT 문서들이 '{DB_PATH}' 폴더에 저장되었습니다!\n")