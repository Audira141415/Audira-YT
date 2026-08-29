import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/docs") # Since there might not be a health check, let's just test if /docs loads
    assert response.status_code == 200
