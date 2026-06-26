from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class HealthView(APIView):
    def get(self, request):
        return Response({"ok": True, "service": "intelyhire-engine"})


class MatchV1View(APIView):
    def post(self, request):
        # Stub response for now. Will be replaced by:
        # - Candidate DNA building
        # - Knowledge graph construction
        # - Semantic matching + multi-factor ranking
        return Response(
            {
                "ok": True,
                "engine": "intelyhire-engine",
                "match": {
                    "candidate": request.data.get("candidateId"),
                    "job": request.data.get("jobId"),
                    "overallScore": 0,
                    "ranking": [],
                    "factors": {
                        "skillsMatch": 0,
                        "experienceMatch": 0,
                        "educationMatch": 0,
                        "careerGrowth": 0,
                        "salaryCompatibility": 0,
                        "locationPreference": 0,
                        "languageMatch": 0,
                    },
                    "recommendation": "Needs data / not implemented yet"
                },
            },
            status=status.HTTP_200_OK,
        )



