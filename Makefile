.PHONY: up down logs test migrate revision shell

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f api

test:
	docker compose exec api pytest -v

migrate:
	docker compose exec api alembic upgrade head

# uso: make revision msg="cria tabela devices"
revision:
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

shell:
	docker compose exec api bash
