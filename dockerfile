# 1단계: Node 이미지를 이용해 프론트엔드 빌드
FROM node:21-alpine AS build
WORKDIR /app
# package.json, package-lock.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci
# 소스 코드 전체 복사 후 빌드 실행
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드한 결과물을 복사하여 정적파일로 서빙
FROM nginx:alpine
# 기본 Nginx 설정은 /usr/share/nginx/html 하위에서 정적 파일을 서빙하도록 되어 있음
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]