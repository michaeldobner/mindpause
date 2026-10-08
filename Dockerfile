# MIND PAUSE als statische Seite hinter nginx.
#
# In Coolify: neue Resource, Quelle dieses Repository, Build Pack "Dockerfile",
# Port 80. Welche Dateien ins Abbild kommen, steht in .dockerignore: nur das,
# was der Browser braucht, also keine Tests, Skripte, READMEs und Dokumentation.

FROM nginx:1.29-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html/

# Die Konfiguration liegt schon an ihrem Platz, im Web hat sie nichts zu suchen
RUN rm -rf /usr/share/nginx/html/deploy \
    && nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1
