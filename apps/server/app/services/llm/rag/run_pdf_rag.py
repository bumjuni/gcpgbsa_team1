import os
import glob
from dotenv import load_dotenv 
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_community.vectorstores import Chroma


load_dotenv()

# =====================================================================
# 1. 구글 클라우드(GCP) 프로젝트 ID 설정
# =====================================================================

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
os.environ["GOOGLE_CLOUD_PROJECT"] = GCP_PROJECT_ID
os.environ["CLOUD_ML_REGION"] = "asia-northeast3"

# =====================================================================
# 2. 폴더 안의 모든 PDF 파일 한 번에 불러오기 (수정된 핵심 부분!)
# =====================================================================
pdf_folder_path = "PDF_Books"  

# 폴더 내 모든 .pdf 파일 경로를 리스트로 가져옴
pdf_files = glob.glob(os.path.join(pdf_folder_path, "*.pdf"))
print(f"📂 '{pdf_folder_path}' 폴더에서 총 {len(pdf_files)}개의 PDF 파일을 발견했습니다!")

documents = []

for file_path in pdf_files:
    file_name = os.path.basename(file_path)
    print(f"   📖 '{file_name}' 읽는 중...")
    try:
        loader = PyPDFLoader(file_path)
        documents.extend(loader.load())
    except Exception as e:
        print(f"   ⚠️ '{file_name}' 읽기 실패 (건너뜀): {e}")

print(f"✅ 모든 PDF 로딩 완료! (총 {len(documents)}개 페이지 통합됨)\n")

# =====================================================================
# 3. 문서 조각내기 (Chunking)
# =====================================================================
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)

chunks = text_splitter.split_documents(documents)
print(f"✅ 청킹 완료! 전체 문서가 총 [{len(chunks)}개]의 의미 조각(Chunk)으로 분할되었습니다.\n")

# =====================================================================
# 4. [구글 크레딧 사용] Vertex AI 임베딩 & 디스크 영구 저장
# =====================================================================
print("⏳ PDF 파일 벡터화 및 하드디스크('./my_rag_db') 저장 중...")

embedding_model = VertexAIEmbeddings(
    model_name="text-multilingual-embedding-002",
    project=GCP_PROJECT_ID,
    location="asia-northeast3"
)

# ★ 핵심: TXT와 동일한 폴더 경로에 저장하여 함께 관리
DB_PATH = "./my_rag_db"
batch_size = 30
vector_db = None

# PDF 청크를 30개씩 나누어 안전하게 디스크에 구워줌
for i in range(0, len(chunks), batch_size):
    batch_chunks = chunks[i : i + batch_size]
    print(f"   ▶ PDF {i + 1} ~ {min(i + batch_size, len(chunks))}번째 조각 저장 중...")
    
    if vector_db is None:
        vector_db = Chroma.from_documents(
            documents=batch_chunks,
            embedding=embedding_model,
            collection_name="real_pdf_data",  # <-- PDF 전용 방 이름
            persist_directory=DB_PATH        # <-- ★ 하드디스크 영구 저장 필수 옵션!
        )
    else:
        vector_db.add_documents(batch_chunks)

print(f"✅ PDF 문서들이 '{DB_PATH}' 폴더에 저장되었습니다!\n")