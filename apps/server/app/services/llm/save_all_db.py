import os
import glob
from dotenv import load_dotenv  # ★ 추가된 부분: .env 파일을 읽어오기 위한 모듈
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_community.vectorstores import Chroma

# ★ 추가된 부분: .env 파일 안의 비밀 정보를 불러옵니다.
load_dotenv()

# =====================================================================
# 1. 구글 클라우드(GCP) 프로젝트 설정
# =====================================================================
# ★ .env 파일에서 프로젝트 ID를 안전하게 가져오도록 변경되었습니다!
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"

DB_PATH = "./my_rag_db"  # 모든 데이터가 영구 보관될 컴퓨터 폴더 경로
print("⏳ 구글 Vertex AI 임베딩 모델 준비 중...")
embedding_model = VertexAIEmbeddings(
    model_name="text-multilingual-embedding-002",
    project=GCP_PROJECT_ID,
    location="asia-northeast3"
)

# 공통 텍스트 분할기 (Chunking Tool)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=60,
    separators=["\n\n", "\n", ". ", " ", ""],
)

# =====================================================================
# 2. [1번 방: 'real_txt_data'] -> TXT 파일들 저장하기
# =====================================================================
txt_folder_path = "Basic_Tech"  # ★ TXT 파일들이 들어있는 폴더
txt_files = glob.glob(os.path.join(txt_folder_path, "*.txt"))
print(f"\n📂 [TXT 저장 시작] '{txt_folder_path}' 폴더에서 {len(txt_files)}개 파일 발견!")

txt_docs = []
for file_path in txt_files:
    try:
        loader = TextLoader(file_path, encoding="utf-8")
        txt_docs.extend(loader.load())
    except UnicodeDecodeError:
        loader = TextLoader(file_path, encoding="cp949")
        txt_docs.extend(loader.load())

if txt_docs:
    txt_chunks = text_splitter.split_documents(txt_docs)
    print(f"   ▶ TXT 총 [{len(txt_chunks)}개] 조각으로 분할! DB 저장 중...")
    
    # 30개씩 안전하게 밀어넣기
    batch_size = 30
    txt_db = None
    for i in range(0, len(txt_chunks), batch_size):
        batch = txt_chunks[i : i + batch_size]
        if txt_db is None:
            txt_db = Chroma.from_documents(
                documents=batch,
                embedding=embedding_model,
                collection_name="real_txt_data",  # <-- TXT 방 이름
                persist_directory=DB_PATH
            )
        else:
            txt_db.add_documents(batch)
    print("✅ TXT 문서 DB 영구 저장 완료!")
else:
    print("   ⚠️ TXT 파일을 찾지 못했습니다. 경로를 확인해주세요.")

# =====================================================================
# 3. [2번 방: 'real_pdf_data'] -> PDF 파일 저장하기
# =====================================================================
pdf_file_name = "Swimming_TextBook.pdf"  # ★ 저장할 PDF 파일 이름
if os.path.exists(pdf_file_name):
    print(f"\n📂 [PDF 저장 시작] '{pdf_file_name}' 로딩 중...")
    loader = PyPDFLoader(pdf_file_name)
    pdf_docs = loader.load()
    pdf_chunks = text_splitter.split_documents(pdf_docs)
    print(f"   ▶ PDF 총 [{len(pdf_chunks)}개] 조각으로 분할! DB 저장 중...")

    batch_size = 30
    pdf_db = None
    for i in range(0, len(pdf_chunks), batch_size):
        batch = pdf_chunks[i : i + batch_size]
        if pdf_db is None:
            pdf_db = Chroma.from_documents(
                documents=batch,
                embedding=embedding_model,
                collection_name="real_pdf_data",  # <-- PDF 방 이름
                persist_directory=DB_PATH
            )
        else:
            pdf_db.add_documents(batch)
    print("✅ PDF 문서 DB 영구 저장 완료!")
else:
    print(f"   ⚠️ '{pdf_file_name}' PDF 파일이 존재하지 않습니다.")

print(f"\n🎉 모든 작업 완료! './my_rag_db' 폴더 안에 TXT와 PDF DB가 각각 저장되었습니다.")