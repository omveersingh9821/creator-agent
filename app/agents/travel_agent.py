import json
import random
from typing import List, Dict, Any

from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent  # pyre-ignore[21]
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage

from app.config.settings import LLM_PROVIDER, TEMPERATURE, MODEL_NAME
from app.core.llm_factory import get_llm


# ─── MOCK TRAVEL DATA TOOLS ────────────────────────────────────────────────────────

@tool
def search_flights(origin: str, destination: str, departure_date: str) -> str:
    """Search for the cheapest flights between an origin and destination on a specific date.
    
    Args:
        origin: The departure city or airport code (e.g., "NYC", "JFK", "London")
        destination: The arrival city or airport code (e.g., "MIA", "Miami", "Tokyo")
        departure_date: The date of departure (e.g., "2024-05-15" or "next weekend")
    """
    airlines = ["Delta", "United", "American Airlines", "JetBlue", "Southwest", "Spirit"]
    flight_data = []
    
    for _ in range(random.randint(3, 5)):
        price = random.randint(59, 450)
        airline = random.choice(airlines)
        duration_hours = random.randint(2, 6)
        duration_mins = random.randint(0, 59)
        dep_hour = random.randint(5, 20)
        dep_time = f"{dep_hour:02d}:00"
        arr_hour = (dep_hour + duration_hours) % 24
        arr_time = f"{arr_hour:02d}:{duration_mins:02d}"
        
        flight_data.append({
            "airline": airline,
            "flight_number": f"{str(airline)[:2].upper()}{random.randint(100, 999)}",
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "duration": f"{duration_hours}h {duration_mins}m",
            "price": price,
            "stops": random.choice([0, 0, 0, 1])
        })
        
    flight_data.sort(key=lambda x: x["price"])
    return json.dumps(flight_data)


@tool
def search_hotels(location: str, checkin_date: str, length_of_stay_nights: int = 1) -> str:
    """Search for hotels in a specific location.
    
    Args:
        location: The city or area to search for hotels (e.g., "Miami Beach")
        checkin_date: The date of check-in
        length_of_stay_nights: Number of nights for the stay
    """
    brands = ["Marriott", "Hilton", "Hyatt", "Four Seasons", "Boutique Inn", "Seaside Resort", "City View Hotel"]
    hotel_data = []
    
    for _ in range(random.randint(3, 5)):
        stars = random.choice([3, 4, 4, 5])
        base_price = 80 if stars == 3 else 150 if stars == 4 else 300
        price_per_night = base_price + random.randint(-20, 150)
        rating = round(random.uniform(3.5, 4.9), 1)
        name = f"The {random.choice(brands)} {location}"
        
        hotel_data.append({
            "name": name,
            "stars": stars,
            "rating": rating,
            "price_per_night": price_per_night,
            "amenities": random.sample(["Free WiFi", "Pool", "Spa", "Gym", "Breakfast Included", "Ocean View"], k=random.randint(2, 4))
        })
        
    hotel_data.sort(key=lambda x: x["rating"], reverse=True)
    return json.dumps(hotel_data)


# ─── AGENT CONFIGURATION ───────────────────────────────────────────────────────

tools = [search_flights, search_hotels]

system_prompt = """You are an elite, modern AI Travel Assistant.
Your job is to parse the user's travel request, use your tools to search for the best and cheapest flights and hotels, and summarize the best options.

CRITICAL REQUIREMENT: You MUST strictly return your final answer as beautifully formatted JSON. 

The JSON object MUST strictly adhere to this exact schema (arrays can be empty if not requested):
{{
  "ai_summary": "A friendly, engaging summary (2-3 sentences max) explaining what you found.",
  "flights": [
    {{
      "airline": "Airline Name",
      "flight_number": "AB123",
      "departure_time": "08:00",
      "arrival_time": "11:30",
      "duration": "3h 30m",
      "price": 199,
      "stops": 0
    }}
  ],
  "hotels": [
    {{
      "name": "Hotel Name",
      "stars": 4,
      "rating": 4.6,
      "price_per_night": 150,
      "amenities": ["Pool", "Free WiFi"]
    }}
  ]
}}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

def create_travel_agent():
    from app.core.llm_factory import get_llm
    llm = get_llm()
    # Using langgraph's prebuilt react agent instead of deprecated AgentExecutor
    return create_react_agent(llm, tools, state_modifier=system_prompt)

def run_travel_agent(query: str) -> Dict[str, Any]:
    agent_executor = create_travel_agent()
    
    try:
        response = agent_executor.invoke({"messages": [("user", query)]})
        # Original logic extracted from 'output'. In langgraph it's the last message content.
        output_str = response["messages"][-1].content
            
        # Clean up markdown code blocks if the LLM wrapped the JSON
        if output_str.startswith("```json"):
            output_str = output_str[7:]
        if output_str.startswith("```"):
            output_str = output_str[3:]
        if output_str.endswith("```"):
            output_str = output_str[:-3]
            
        return json.loads(output_str.strip())
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse agent output as JSON: {e}")
        # If the user's query lacked info (e.g. no origin city) and the agent just asked a question back
        # gracefully wrap that question into the AI summary rather than throwing an error.
        text_response = output_str if 'output_str' in locals() else str(e)
        return {
            "ai_summary": text_response,
            "flights": [],
            "hotels": []
        }
    except Exception as e:
        print(f"Travel Agent execution error: {e}")
        raise RuntimeError(f"Travel agent failed to execute: {str(e)}")
