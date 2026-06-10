// 장소 랭킹 화면 — 사진 카드 목록 + 바텀시트 상세. App에서 lazy 로드.
import { useState } from "react";
import { MapPin, Plus, Star, X } from "lucide-react";
import {
  categoryColors,
  categoryLabels,
  cityLabels,
  getEnhancement,
  getPlaceScore,
  getShortLabel,
  places,
  placesById,
  traitBadges,
} from "../appCore";
import type { Place, PlaceCategory, RouteItem, TabKey } from "../appCore";
import type { City } from "../data";
import { categoryShortLabels } from "../placeEnhancements";
import { Pill, PlaceInsightCard, PlaceNameBlock, usePlaceMedia } from "../components/place";

type RankSortKey = "popular" | "rating" | "fast";
type QuickFilterKey = "all" | "must" | "reservation" | "free" | "korean" | "photo" | "indoor";

const rankSortLabels: Record<RankSortKey, string> = {
  popular: "인기순",
  rating: "평점순",
  fast: "소요시간순",
};

const quickFilterLabels: Record<QuickFilterKey, string> = {
  all: "전체",
  must: "필수",
  reservation: "예약",
  free: "무료·저가",
  korean: "한국인",
  photo: "사진",
  indoor: "실내",
};

function matchesQuickFilter(place: Place, filter: QuickFilterKey) {
  if (filter === "all") return true;
  if (filter === "must") return place.priority === 1;
  if (filter === "reservation") return place.reservation === "필수" || place.reservation === "권장";
  if (filter === "free") return place.price === "무료" || place.price === "낮음";
  if (filter === "korean") return place.tags.includes("한국인선호") || Boolean(place.koreanTips?.length);
  if (filter === "photo") return place.photo === 3;
  if (filter === "indoor") return place.tags.includes("실내") || place.category === "cafe";
  return true;
}

function CustomPlaceForm({
  onAdd,
}: {
  onAdd: (input: { name: string; city: City; category: PlaceCategory; lat: number; lng: number; memo?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState<City>("rome");
  const [category, setCategory] = useState<PlaceCategory>("attraction");
  const [coords, setCoords] = useState("");
  const [memo, setMemo] = useState("");
  const match = coords.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
  const formCategories: PlaceCategory[] = ["attraction", "food", "cafe", "shopping", "view", "rest"];

  return (
    <div className="custom-place-form">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="장소 이름" />
      <div className="custom-place-row">
        <select value={city} onChange={(event) => setCity(event.target.value as City)} aria-label="도시">
          {(Object.keys(cityLabels) as City[]).map((key) => (
            <option key={key} value={key}>
              {cityLabels[key]}
            </option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value as PlaceCategory)} aria-label="카테고리">
          {formCategories.map((key) => (
            <option key={key} value={key}>
              {categoryLabels[key]}
            </option>
          ))}
        </select>
      </div>
      <input value={coords} onChange={(event) => setCoords(event.target.value)} placeholder="위도, 경도 붙여넣기 (예: 41.9001, 12.4905)" />
      <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모 (선택) — 왜 가는지, 예약 번호 등" />
      <button
        className="solid-button compact"
        disabled={!name.trim() || !match}
        onClick={() => {
          if (!name.trim() || !match) return;
          onAdd({ name: name.trim(), city, category, lat: parseFloat(match[1]), lng: parseFloat(match[2]), memo });
          setName("");
          setCoords("");
          setMemo("");
        }}
      >
        <Plus size={15} /> 장소 추가
      </button>
    </div>
  );
}

function PlacePhotoCard({ place, rank, onOpen }: { place: Place; rank: number; onOpen: () => void }) {
  const enhancement = getEnhancement(place);
  const { imageUrl } = usePlaceMedia(place, enhancement);
  const score = getPlaceScore(place, enhancement);
  const badges = traitBadges(place).slice(0, 3);

  return (
    <article
      className="place-photo-card"
      style={{ ["--photo-color" as string]: categoryColors[place.category] }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="card-photo">
        {imageUrl ? (
          <img src={imageUrl} alt={place.koName} loading="lazy" />
        ) : (
          <div className="photo-fallback">
            <small>{categoryShortLabels[place.category]}</small>
            <strong>{getShortLabel(place)}</strong>
          </div>
        )}
        <span className={rank <= 3 ? "rank-flag top" : "rank-flag"}>{rank}위</span>
      </div>
      <div className="card-body">
        <small>
          {cityLabels[place.city]} · {categoryLabels[place.category]} · {place.area}
        </small>
        <h3>
          <PlaceNameBlock place={place} compact />
          <span className={score.isVerified ? "score-chip" : "score-chip internal"}>
            <Star size={13} />
            {score.isVerified ? `구글 ${score.rating?.toFixed(1)}` : `인기 ${place.rank}`}
          </span>
        </h3>
        <p className="card-desc">{place.why}</p>
        <div className="trait-row">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function RankingScreen({
  rankingCategory,
  setRankingCategory,
  rankingCity,
  setRankingCity,
  query,
  setQuery,
  addToRoute,
  setSelectedPlaceId,
  setActiveTab,
  customPlaces,
  addCustomPlace,
  removeCustomPlace,
  selectedRoute,
  replaceNext,
  notes,
  setPlaceNote,
}: {
  rankingCategory: PlaceCategory | "all";
  setRankingCategory: (category: PlaceCategory | "all") => void;
  rankingCity: "all" | "rome" | "florence";
  setRankingCity: (city: "all" | "rome" | "florence") => void;
  query: string;
  setQuery: (value: string) => void;
  addToRoute: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
  setActiveTab: (tab: TabKey) => void;
  customPlaces: Place[];
  addCustomPlace: (input: { name: string; city: City; category: PlaceCategory; lat: number; lng: number; memo?: string }) => void;
  removeCustomPlace: (placeId: string) => void;
  selectedRoute: RouteItem[];
  replaceNext: (id: string) => void;
  notes: Record<string, string>;
  setPlaceNote: (placeId: string, text: string) => void;
}) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [sortKey, setSortKey] = useState<RankSortKey>("popular");
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>("all");
  const [detailId, setDetailId] = useState<string>();
  const customIds = new Set(customPlaces.map((place) => place.id));
  const categories: (PlaceCategory | "all")[] = ["all", "attraction", "food", "cafe", "view", "shopping"];
  const sorters: Record<RankSortKey, (a: Place, b: Place) => number> = {
    popular: (a, b) => b.rank - a.rank,
    rating: (a, b) =>
      (getPlaceScore(b).rating ?? 0) - (getPlaceScore(a).rating ?? 0) || b.rank - a.rank,
    fast: (a, b) => a.durationMin - b.durationMin || b.rank - a.rank,
  };
  const filtered = places
    .filter((place) => place.category !== "stay" && place.category !== "station")
    .filter((place) => rankingCategory === "all" || place.category === rankingCategory)
    .filter((place) => rankingCity === "all" || place.city === rankingCity)
    .filter((place) => matchesQuickFilter(place, quickFilter))
    .filter((place) =>
      `${place.koName} ${place.name} ${place.area} ${place.tags.join(" ")} ${(place.menuHints ?? []).join(" ")} ${(getEnhancement(place).highlights ?? []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .sort(sorters[sortKey]);
  const detailPlace = detailId ? placesById.get(detailId) : undefined;

  const clusters = Array.from(
    places
      .filter((place) => place.priority <= 2 && place.category !== "stay" && place.category !== "station")
      .reduce((map, place) => {
        const key = `${cityLabels[place.city]} · ${place.area}`;
        const current = map.get(key) ?? [];
        current.push(place);
        map.set(key, current);
        return map;
      }, new Map<string, Place[]>())
  ).sort((a, b) => b[1].reduce((sum, place) => sum + place.rank, 0) - a[1].reduce((sum, place) => sum + place.rank, 0));

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">장소</p>
          <h1>장소 둘러보기</h1>
          <p className="subline">명소·맛집·카페를 인기순으로 — 카드를 누르면 상세 정보</p>
        </div>
        <button className="ghost-button compact" onClick={() => setShowCustomForm((current) => !current)}>
          <Plus size={16} />
          내 장소
        </button>
      </div>

      {showCustomForm && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>내 장소 추가</h2>
            <Pill>커스텀</Pill>
          </div>
          <p className="settings-hint">구글지도에서 장소를 길게 눌러 좌표를 복사해 붙여넣으세요.</p>
          <CustomPlaceForm
            onAdd={(input) => {
              addCustomPlace(input);
              setShowCustomForm(false);
            }}
          />
        </section>
      )}

      <div className="rank-controls">
        <div className="segmented">
          {(["all", "rome", "florence"] as const).map((city) => (
            <button key={city} className={rankingCity === city ? "active" : ""} onClick={() => setRankingCity(city)}>
              {city === "all" ? "전체" : cityLabels[city]}
            </button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="장소, 권역, 태그 검색" />
      </div>

      <div className="filter-row">
        {categories.map((category) => (
          <button
            key={category}
            className={rankingCategory === category ? "filter-chip active" : "filter-chip"}
            onClick={() => setRankingCategory(category)}
          >
            {category === "all" ? "전체" : categoryLabels[category]}
          </button>
        ))}
      </div>

      <div className="filter-row quick-filter-row" aria-label="빠른 조건">
        {(Object.keys(quickFilterLabels) as QuickFilterKey[]).map((key) => (
          <button
            key={key}
            className={quickFilter === key ? "filter-chip active" : "filter-chip"}
            onClick={() => setQuickFilter(key)}
          >
            {quickFilterLabels[key]}
          </button>
        ))}
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>권역 묶음</h2>
          <Pill>동선 기준</Pill>
        </div>
        <div className="cluster-row">
          {clusters.slice(0, 8).map(([area, list]) => (
            <button
              key={area}
              onClick={() => {
                setQuery(area.split(" · ")[1]);
              }}
            >
              <strong>{area}</strong>
              <span>{list.slice(0, 4).map((place) => place.koName).join(", ")}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="sort-row">
        <span>
          {filtered.length}곳 · {rankSortLabels[sortKey]} · {quickFilterLabels[quickFilter]} · 인기점수는 출처 중복과 동선 실용성 기준
        </span>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as RankSortKey)} aria-label="정렬 기준">
          {(Object.keys(rankSortLabels) as RankSortKey[]).map((key) => (
            <option key={key} value={key}>
              {rankSortLabels[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="place-list">
        {filtered.map((place, index) => (
          <PlacePhotoCard key={place.id} place={place} rank={index + 1} onOpen={() => setDetailId(place.id)} />
        ))}
      </div>

      {detailPlace && (
        <div className="sheet-backdrop" onClick={() => setDetailId(undefined)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => setDetailId(undefined)} aria-label="닫기">
              <X size={16} />
            </button>
            <PlaceInsightCard
              place={detailPlace}
              selectedRoute={selectedRoute}
              addToRoute={addToRoute}
              replaceNext={replaceNext}
              setSelectedPlaceId={setDetailId}
              note={notes[detailPlace.id]}
              setPlaceNote={setPlaceNote}
            />
            <div className="card-actions" style={{ marginTop: 10 }}>
              <button
                className="ghost-button compact"
                onClick={() => {
                  setSelectedPlaceId(detailPlace.id);
                  setActiveTab("map");
                  setDetailId(undefined);
                }}
              >
                <MapPin size={16} /> 지도에서 보기
              </button>
              {customIds.has(detailPlace.id) && (
                <button
                  className="ghost-button compact"
                  onClick={() => {
                    if (window.confirm(`'${detailPlace.koName}'을(를) 삭제할까요?`)) {
                      removeCustomPlace(detailPlace.id);
                      setDetailId(undefined);
                    }
                  }}
                >
                  <X size={16} /> 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
