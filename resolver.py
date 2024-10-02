import pandas as pd # 데이터 읽기
import sys  # node와 연결
import json # json 형식
import re # 정규화 형식 Regular expression operations

item_fname = "data/movie_final.csv"
# 전처리 시 header를 잡지 않아 columns로 잡음
columns = ['id', 'title', 'genres', 'imdb_id', 'tmdb_id', 'imdb_url', 'rating_count', 'rating_avg', 'image_url']

# index.js (node에서 넘김 count 파라미터 전달 받음)
def random_items(count):
  movies_df=pd.read_csv(item_fname)[1:] # 1부터 시작
  movies_df = movies_df.fillna("") # 공백을 채워준다
  result_items = movies_df.sample(n=count).to_dict("records")
  return result_items

def latest_items(count):
    # CSV 파일을 읽어옴
    movies_df = pd.read_csv(item_fname)[1:] # 1부터 시작
    movies_df = movies_df.fillna("")  # 공백으로 NaN을 채워줌

    # 영화 제목에서 연도를 추출하는 함수 (예: "Journey to the Center of the Earth (1959)" -> 1959)
    def extract_year(title):
        match = re.search(r'\((\d{4})\)', title)
        if match:
            return int(match.group(1))
        return None  # 연도가 없으면 None 반환

    # 연도 정보를 추출해서 새로운 'year' 컬럼에 추가
    movies_df['year'] = movies_df['title'].apply(extract_year)

    # 연도 기준으로 내림차순으로 정렬하고 최신 10개 항목 선택
    latest_movies_df = movies_df.sort_values(by='year', ascending=False).head(count)

    # 결과를 딕셔너리 형태로 반환
    result_items = latest_movies_df.to_dict("records")
    return result_items

# genre 키워드를 포함하는 영화 count개 반환

def genres_itmes(genre, count):

  movies_df = pd.read_csv(item_fname, names=columns)
  genres_df = movies_df.fillna("") # NaN일 경우 공백으로 반환
  genres_df = movies_df[movies_df["genres"].str.contains(genre, case=False, na=False)]
  # case = False : 대소문자 구분 안함

  result_items = genres_df.sample(n=count).to_dict("records")
  return result_items


# resolver.py가 시작할 때 함수
# random을 sys.argv[1]으로 받아 try, except 
# 파이썬 명령행 인자 sys.argv
# count를 json으로 변환

if __name__ == "__main__":
  try:
    command = sys.argv[1]

    if command == "random":
      count = int(sys.argv[2])
      print(json.dumps(random_items(count)))
    elif command == "latest":
      count = int(sys.argv[2])
      print(json.dumps(latest_items(count)))
    elif command == "genres":
      genre = sys.argv[2]
      count = int(sys.argv[3])
      print(json.dumps(genres_itmes(genre, count)))
    else:
      print("Error: Invalid command error")
      sys.exit(1)

  except ValueError:
    print("Error: Invalid arguments")
    sys.exit(1)

    