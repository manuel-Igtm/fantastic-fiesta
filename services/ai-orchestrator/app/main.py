from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Save Sabi AI Orchestrator",
    version="0.1.0",
    description="Policy-aware AI orchestration service for financial scenarios.",
)


class ScenarioRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=1000)
    language: str = Field(default="en", pattern="^(en|sw)$")
    monthly_income: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    goal_commitments: float = Field(ge=0)


class ScenarioResponse(BaseModel):
    recommendation: str
    safer_alternatives: List[str]
    action_plan: List[str]
    explainability: str
    generated_at: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-orchestrator"}


@app.post("/v1/scenario", response_model=ScenarioResponse)
def run_scenario(payload: ScenarioRequest) -> ScenarioResponse:
    disposable_balance = payload.monthly_income - payload.monthly_expenses - payload.goal_commitments
    can_afford = disposable_balance >= 0

    if can_afford:
        recommendation = "You can proceed with caution and keep your emergency fund contribution active."
        alternatives = [
            "Proceed with a spending cap for discretionary categories.",
            "Delay non-essential purchases until mid-cycle cashflow check.",
        ]
    else:
        recommendation = "Not advisable this cycle. Prioritize essentials and goal continuity."
        alternatives = [
            "Postpone this purchase by two weeks and reassess after next inflow.",
            "Reduce discretionary spending by 10-15% and re-evaluate.",
        ]

    return ScenarioResponse(
        recommendation=recommendation,
        safer_alternatives=alternatives,
        action_plan=[
            "Review your 80/20 spend split in Insights.",
            "Keep savings automation enabled to maintain discipline.",
            "Re-check affordability after your next confirmed inflow.",
        ],
        explainability="Recommendation is based on net disposable balance after expenses and goal commitments.",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
