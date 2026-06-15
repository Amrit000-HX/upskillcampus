"""Mining Sites administration module.

Manages different flotation plant zones and operational sites
with site-specific configuration and monitoring.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mining-sites", tags=["mining-sites"])


class MiningSite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    location: str
    site_type: str = "flotation"  # flotation, grinding, crushing
    status: str = "active"  # active, maintenance, offline
    flotation_columns: int = 7
    description: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    config: dict = Field(default_factory=dict)


class SiteCreate(BaseModel):
    name: str
    location: str
    site_type: str = "flotation"
    flotation_columns: int = 7
    description: str = ""
    config: dict = Field(default_factory=dict)


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    site_type: Optional[str] = None
    status: Optional[str] = None
    flotation_columns: Optional[int] = None
    description: Optional[str] = None
    config: Optional[dict] = None


# In-memory store with demo sites
_sites: dict[str, MiningSite] = {}


def _seed_demo_sites():
    demos = [
        MiningSite(
            id="site-001",
            name="Primary Flotation Plant",
            location="Zone A - North Pit",
            site_type="flotation",
            status="active",
            flotation_columns=7,
            description="Main iron ore flotation circuit processing 400 t/h. Equipped with 7 flotation columns for silica separation.",
            config={"target_silica": 2.0, "ph_range": [9.5, 10.5], "model": "ensemble"},
        ),
        MiningSite(
            id="site-002",
            name="Secondary Grinding Circuit",
            location="Zone B - South Ridge",
            site_type="grinding",
            status="active",
            flotation_columns=0,
            description="Ball mill grinding circuit reducing particle size before flotation. Throughput: 250 t/h.",
            config={"target_p80": 75, "mill_speed": 14.5},
        ),
        MiningSite(
            id="site-003",
            name="Tertiary Flotation Unit",
            location="Zone C - East Block",
            site_type="flotation",
            status="maintenance",
            flotation_columns=4,
            description="Auxiliary flotation unit for re-processing middlings. Currently under scheduled maintenance.",
            config={"target_silica": 1.8, "ph_range": [9.8, 10.2], "model": "lightgbm"},
        ),
        MiningSite(
            id="site-004",
            name="Crushing & Screening Plant",
            location="Zone D - Quarry Face",
            site_type="crushing",
            status="active",
            flotation_columns=0,
            description="Primary jaw crusher and vibrating screen for initial ore reduction. Capacity: 600 t/h.",
            config={"target_size": 150, "screen_aperture": 50},
        ),
    ]
    for site in demos:
        _sites[site.id] = site


_seed_demo_sites()


@router.get("")
def list_sites(status: Optional[str] = None):
    """List all mining sites, optionally filtered by status."""
    sites = list(_sites.values())
    if status:
        sites = [s for s in sites if s.status == status]
    return {
        "sites": [s.model_dump() for s in sites],
        "total": len(sites),
        "active": sum(1 for s in _sites.values() if s.status == "active"),
        "maintenance": sum(1 for s in _sites.values() if s.status == "maintenance"),
        "offline": sum(1 for s in _sites.values() if s.status == "offline"),
    }


@router.get("/{site_id}")
def get_site(site_id: str):
    """Get details of a specific mining site."""
    if site_id not in _sites:
        raise HTTPException(status_code=404, detail=f"Site {site_id} not found")
    return _sites[site_id].model_dump()


@router.post("")
def create_site(data: SiteCreate):
    """Create a new mining site."""
    site = MiningSite(**data.model_dump())
    _sites[site.id] = site
    return site.model_dump()


@router.put("/{site_id}")
def update_site(site_id: str, data: SiteUpdate):
    """Update an existing mining site."""
    if site_id not in _sites:
        raise HTTPException(status_code=404, detail=f"Site {site_id} not found")
    site = _sites[site_id]
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(site, key, value)
    _sites[site_id] = site
    return site.model_dump()


@router.delete("/{site_id}")
def delete_site(site_id: str):
    """Delete a mining site."""
    if site_id not in _sites:
        raise HTTPException(status_code=404, detail=f"Site {site_id} not found")
    del _sites[site_id]
    return {"deleted": site_id}
