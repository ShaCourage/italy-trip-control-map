// 지도 화면 — leaflet 의존성을 이 파일로 격리하고 App에서 lazy 로드한다 (메인 청크 절감).
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Filter,
  Lock,
  MapPin,
  Navigation,
  Plus,
  Route,
  Shield,
  Star,
  Utensils,
  X,
} from "lucide-react";
import {
  activeTemplateRoutes,
  categoryColors,
  categoryLabels,
  escapeHtml,
  filterLabels,
  formatDistanceKm,
  getEnhancement,
  getPlace,
  getPlaceScore,
  getShortLabel,
  makeDirectionsUrl,
  makeGooglePlaceUrl,
  modeLabels,
  places,
  placesById,
} from "../appCore";
import type { FilterKey, ModeKey, Place, PlaceCategory, RouteItem, RouteStats, TripDay } from "../appCore";
import { categoryShortLabels } from "../placeEnhancements";
import { DayStrip, IconButton, Pill, PlaceInsightCard, PlaceThumb, RecommendedRouteCard } from "../components/place";

function FitMap({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: false });
  }, [map, points]);

  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
}

function PlaceMapMarker({
  place,
  routeIndex,
  isSelected,
  inRoute,
  showLabel,
  onSelect,
  addToRoute,
  replaceNext,
}: {
  place: Place;
  routeIndex?: number;
  isSelected: boolean;
  inRoute: boolean;
  showLabel: boolean;
  onSelect: () => void;
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
}) {
  const google = getPlaceScore(place);
  const icon = useMemo(() => {
    const color = categoryColors[place.category];
    // 라벨은 루트 순번·선택·확대 시에만 — 도시 줌에서 136개 라벨이 겹쳐 쌓이는 문제 방지
    if (!showLabel) {
      if (typeof routeIndex === "number") {
        return L.divIcon({
          className: "route-number-marker",
          html: `<span>${routeIndex + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
      }
      const size = isSelected ? 22 : 15;
      return L.divIcon({
        className: "place-dot-wrap",
        html: `<i class="place-dot-marker ${isSelected ? "selected" : ""}" style="--dot-color:${color}"></i>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }
    const label = escapeHtml(getShortLabel(place));
    const category = escapeHtml(categoryShortLabels[place.category]);
    const routeBadge =
      typeof routeIndex === "number"
        ? `<span>${routeIndex + 1}</span>`
        : `<span style="background:${color}">${category}</span>`;
    return L.divIcon({
      className: `place-label-marker ${isSelected ? "selected" : ""} ${inRoute ? "in-route" : ""}`,
      html: `${routeBadge}<strong>${label}</strong>`,
      iconSize: [120, 34],
      iconAnchor: [18, 17],
    });
  }, [inRoute, isSelected, place, routeIndex, showLabel]);

  return (
    <Marker position={[place.lat, place.lng]} icon={icon} eventHandlers={{ click: onSelect }}>
      <Tooltip direction="top" offset={[0, -18]}>
        {place.koName}
      </Tooltip>
      <Popup>
        <div className="map-popup">
          <strong>{place.koName}</strong>
          <span>
            {categoryLabels[place.category]} · {place.area} · {google.ratingText}
          </span>
          <p>{place.why}</p>
          <div className="popup-meta">
            {google.reviewCountLabel && (
              <span>
                <Star size={13} /> {google.reviewCountLabel}
              </span>
            )}
            <span>{google.priceLevel}</span>
            <span>혼잡 {google.crowdLevel}</span>
          </div>
          <div className="popup-actions">
            <button onClick={() => addToRoute(place.id)}>
              <Plus size={14} /> 추가
            </button>
            <button onClick={() => replaceNext(place.id)}>
              <Route size={14} /> 교체
            </button>
            <a href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Maps
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapLegend({ visibleCount, totalCount }: { visibleCount: number; totalCount: number }) {
  const legendItems: { category: PlaceCategory; label: string }[] = [
    { category: "attraction", label: "명소" },
    { category: "food", label: "맛집" },
    { category: "cafe", label: "카페" },
    { category: "view", label: "전망" },
    { category: "shopping", label: "쇼핑" },
    { category: "station", label: "역" },
  ];

  return (
    <div className="map-legend">
      <div className="map-legend-summary">
        <Filter size={15} />
        <strong>{visibleCount}</strong>
        <span>/ {totalCount}개 중요 핀 표시</span>
      </div>
      <div className="legend-dots">
        {legendItems.map((item) => (
          <span key={item.category}>
            <i style={{ backgroundColor: categoryColors[item.category] }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MapScreen({
  days,
  selectedDayId,
  setDay,
  selectedDay,
  selectedRoute,
  routePositions,
  mapFitPoints,
  mapPlaces,
  selectedPlaceId,
  setSelectedPlaceId,
  filter,
  setFilter,
  mode,
  setMode,
  recommendations,
  stats,
  done,
  nextStop,
  addToRoute,
  replaceNext,
  removeRouteItem,
  moveRouteItem,
  toggleDone,
  clearRoute,
  applyRecommendedRoute,
  notes,
  setPlaceNote,
}: {
  days: TripDay[];
  selectedDayId: string;
  setDay: (id: string) => void;
  selectedDay: TripDay;
  selectedRoute: RouteItem[];
  routePositions: [number, number][];
  mapFitPoints: [number, number][];
  mapPlaces: Place[];
  selectedPlaceId: string;
  setSelectedPlaceId: (id: string) => void;
  filter: FilterKey;
  setFilter: (filter: FilterKey) => void;
  mode: ModeKey;
  setMode: (mode: ModeKey) => void;
  recommendations: { place: Place; score: number; distance: number }[];
  stats: RouteStats;
  done: Record<string, boolean>;
  nextStop?: RouteItem;
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
  removeRouteItem: (uid: string) => void;
  moveRouteItem: (index: number, direction: -1 | 1) => void;
  toggleDone: (uid: string) => void;
  clearRoute: () => void;
  applyRecommendedRoute: (mode?: "replace" | "append") => void;
  notes: Record<string, string>;
  setPlaceNote: (placeId: string, text: string) => void;
}) {
  const [mapZoom, setMapZoom] = useState(13);
  const nextPlace = nextStop ? getPlace(nextStop.placeId) : undefined;
  const selectedPlace = placesById.get(selectedPlaceId);
  const selectedGoogle = selectedPlace ? getPlaceScore(selectedPlace, getEnhancement(selectedPlace)) : undefined;
  const routeAreas = Array.from(new Set(selectedRoute.map((item) => getPlace(item.placeId).area))).slice(0, 3);
  const mustCount = selectedRoute.filter((item) => getPlace(item.placeId).priority === 1).length;
  const foodCount = selectedRoute.filter((item) => getPlace(item.placeId).category === "food" || getPlace(item.placeId).category === "cafe").length;
  const routeIndexByPlaceId = useMemo(
    () => new Map(selectedRoute.map((item, index) => [item.placeId, index])),
    [selectedRoute]
  );

  return (
    <section className="screen map-screen">
      <div className="screen-header map-header">
        <div>
          <p className="eyebrow">Italy Trip Control Map</p>
          <h1>{selectedDay.title}</h1>
          <p className="subline">
            {selectedDay.label} · {selectedDay.areaFocus}
          </p>
        </div>
        <div className="header-actions">
          <select value={mode} onChange={(event) => setMode(event.target.value as ModeKey)} aria-label="루트 모드">
            {Object.entries(modeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <IconButton label="코스 비우기" onClick={clearRoute}>
            <X size={18} />
          </IconButton>
        </div>
      </div>

      <DayStrip days={days} selectedDayId={selectedDayId} setDay={setDay} />

      <div className="filter-row" aria-label="지도 필터">
        {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
          <button key={key} className={filter === key ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(key)}>
            {filterLabels[key]}
          </button>
        ))}
      </div>

      <MapLegend visibleCount={mapPlaces.length} totalCount={places.filter((place) => place.priority <= 2).length} />

      <div className="map-workspace">
        <div className="map-card">
          <MapContainer className="leaflet-map" center={[41.9028, 12.4964]} zoom={13} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMap points={mapFitPoints.length ? mapFitPoints : routePositions} />
            <ZoomWatcher onZoom={setMapZoom} />
            {routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: "#c2502e", weight: 4, opacity: 0.78 }} />}
            {mapPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const inRoute = selectedRoute.some((item) => item.placeId === place.id);
              const routeIndex = routeIndexByPlaceId.get(place.id);
              return (
                <PlaceMapMarker
                  key={place.id}
                  place={place}
                  routeIndex={routeIndex}
                  isSelected={isSelected}
                  inRoute={inRoute}
                  showLabel={isSelected || mapZoom >= 15}
                  onSelect={() => setSelectedPlaceId(place.id)}
                  addToRoute={addToRoute}
                  replaceNext={replaceNext}
                />
              );
            })}
          </MapContainer>
          {selectedPlace && (
            <div className="map-floating-insight">
              <div>
                <span>
                  {categoryLabels[selectedPlace.category]} · {selectedPlace.area} · {selectedGoogle?.ratingText}
                </span>
                <strong>{selectedPlace.koName}</strong>
                <em>
                  {selectedGoogle?.reviewCountLabel ? `${selectedGoogle.reviewCountLabel} · ` : ""}
                  {selectedGoogle?.priceLevel} · 혼잡 {selectedGoogle?.crowdLevel}
                </em>
                <small>{selectedPlace.why}</small>
              </div>
              <div>
                <a href={makeGooglePlaceUrl(selectedPlace)} target="_blank" rel="noreferrer" aria-label={`${selectedPlace.koName} Google Maps`}>
                  <Navigation size={16} />
                </a>
                <button
                  onClick={() => addToRoute(selectedPlace.id)}
                  disabled={selectedRoute.some((item) => item.placeId === selectedPlace.id)}
                  aria-label={`${selectedPlace.koName} 루트 추가`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="route-panel">
          <div className="route-now">
            <div>
              <span className="label">다음</span>
              <strong>{nextPlace?.koName ?? (selectedRoute.length ? "오늘 코스 완료" : "코스 비어 있음")}</strong>
              <p>
                {selectedRoute.length ? `${formatDistanceKm(stats.km)} · 도보 약 ${stats.walkMin}분 · 주의 ${stats.caution}` : "지도 핀이나 추천안에서 장소를 추가하세요"}
              </p>
            </div>
            <a className={selectedRoute.length ? "solid-button compact" : "solid-button compact disabled-link"} href={makeDirectionsUrl(selectedRoute)} target="_blank" rel="noreferrer">
              <Navigation size={16} />
              길찾기
            </a>
          </div>

          <div className="route-signal-grid">
            <div>
              <MapPin size={16} />
              <strong>{routeAreas.join(" · ") || "미정"}</strong>
              <span>오늘 권역</span>
            </div>
            <div>
              <Star size={16} />
              <strong>{mustCount}</strong>
              <span>Must</span>
            </div>
            <div>
              <Utensils size={16} />
              <strong>{foodCount}</strong>
              <span>먹고 쉬기</span>
            </div>
            <div>
              <Shield size={16} />
              <strong>{stats.caution}</strong>
              <span>주의 핀</span>
            </div>
          </div>

          <PlaceInsightCard
            place={selectedPlace}
            selectedRoute={selectedRoute}
            addToRoute={addToRoute}
            replaceNext={replaceNext}
            setSelectedPlaceId={setSelectedPlaceId}
            note={selectedPlace ? notes[selectedPlace.id] : undefined}
            setPlaceNote={setPlaceNote}
          />

          <RecommendedRouteCard
            day={selectedDay}
            recommendedRoute={activeTemplateRoutes()[selectedDay.id] ?? []}
            currentRoute={selectedRoute}
            applyRecommendedRoute={applyRecommendedRoute}
            addToRoute={addToRoute}
            setSelectedPlaceId={setSelectedPlaceId}
          />

          <div className="route-list">
            {selectedRoute.length === 0 && (
              <div className="empty-route">
                <strong>오늘 코스가 비어 있어요.</strong>
                <p>지도 핀, 랭킹, 추천 코스에서 장소를 골라 직접 추가하면 선과 순서가 생깁니다.</p>
              </div>
            )}
            {selectedRoute.map((item, index) => {
              const place = getPlace(item.placeId);
              const isDone = done[item.uid];
              const google = getPlaceScore(place);
              return (
                <div key={item.uid} className={isDone ? "route-item done" : "route-item"}>
                  <button className="route-main" onClick={() => setSelectedPlaceId(place.id)}>
                    <PlaceThumb place={place} order={index + 1} />
                    <span>
                      <strong>{place.koName}</strong>
                      <small>
                        {item.time ? `${item.time} · ` : ""}
                        {categoryLabels[place.category]} · {place.durationMin}분 · {google.ratingText}
                      </small>
                    </span>
                  </button>
                  <div className="route-tools">
                    <IconButton label="완료" onClick={() => toggleDone(item.uid)}>
                      <Check size={16} />
                    </IconButton>
                    {item.locked ? (
                      <IconButton label="고정 일정" disabled title="예약/이동 등 고정 일정이라 수정 불가">
                        <Lock size={16} />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton
                          label="위로"
                          onClick={() => moveRouteItem(index, -1)}
                          disabled={index === 0 || Boolean(selectedRoute[index - 1]?.locked)}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton
                          label="아래로"
                          onClick={() => moveRouteItem(index, 1)}
                          disabled={index === selectedRoute.length - 1 || Boolean(selectedRoute[index + 1]?.locked)}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                        <IconButton label="삭제" onClick={() => removeRouteItem(item.uid)}>
                          <X size={16} />
                        </IconButton>
                      </>
                    )}
                  </div>
                  {item.note && <p className="route-note">{item.note}</p>}
                </div>
              );
            })}
          </div>

          <div className="recommend-box">
            <div className="section-title-row">
              <h2>지금 추천</h2>
              <Pill tone="ok">{modeLabels[mode]}</Pill>
            </div>
            {recommendations.map(({ place, distance }) => {
              const google = getPlaceScore(place);
              return (
                <div className="recommend-item" key={place.id}>
                  <button onClick={() => setSelectedPlaceId(place.id)}>
                    <strong>{place.koName}</strong>
                    <small>
                      {categoryLabels[place.category]} · {formatDistanceKm(distance)} · {google.ratingText} · {place.durationMin}분
                    </small>
                  </button>
                  <IconButton label="루트에 추가" onClick={() => addToRoute(place.id)}>
                    <Plus size={17} />
                  </IconButton>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
