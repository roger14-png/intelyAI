# IntelyHire AI Engine (Django)

This is an initial scaffold for the IntelyHire AI engine implemented with **Django + Django REST Framework**.

## What’s included now
- A `/health` endpoint
- A `/v1/match` endpoint stub that will later implement:
  - Candidate Profile → Career Intelligence Engine → Candidate Knowledge Graph
  - Job Intelligence Engine → Job Knowledge Graph
  - AI Matching Engine → Ranking Engine → Learning Engine

## Next steps
1. Create a Python venv
2. `pip install -r requirements.txt`
3. `python manage.py migrate`
4. `python manage.py runserver`

## Integration
Configure the Node backend to delegate AI matching calls to this service.

