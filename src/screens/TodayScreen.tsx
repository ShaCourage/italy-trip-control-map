import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Map as MapIcon,
  Navigation,
  Plus,
  Route,
  Star,
} from "lucide-react";
import {
  categoryLabels,
  cityLabels,
  formatDistanceKm,
  getEnhancement,
  getPlace,
  getPlaceScore,
  makeDirectionsUrl,
  makeGooglePlaceUrl,
} from "../appCore";
import type { Place, RouteItem, RouteStats, TabKey, TripDay } from "../appCore";
import { DayStrip, IconButton, Pill, PlaceThumb } from "../components/place";

export default function TodayScreen({
  days,
  selectedDay,
  selectedRoute,
  done,
  stats,
  nextPlace,
  recommendations,
  setActiveTab,
  setDay,
  toggleDone,
  checkedItems,
  setCheckedItems,
  sunset,
  missedPlaces,
  addToRoute,
}: {
  days: TripDay[];
  selectedDay: TripDay;
  selectedRoute: RouteItem[];
  done: Record<string, boolean>;
  stats: RouteStats;
  nextPlace?: Place;
  recommendations: { place: Place; score: number; distance: number }[];
  setActiveTab: (tab: TabKey) => void;
  setDay: (id: string) => void;
  toggleDone: (uid: string) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
  sunset?: string;
  missedPlaces: Place[];
  addToRoute: (id: string) => void;
}) {
  const nextGoogle = nextPlace ? getPlaceScore(nextPlace, getEnhancement(nextPlace)) : undefined;

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">오늘</p>
          <h1>{selectedDay.title}</h1>
          <p className="subline">
            {selectedDay.label} · {cityLabels[selectedDay.city]} · {selectedDay.areaFocus}
            {sunset ? ` · 일몰 ${sunset} (계산값)` : ""}
          </p>
        </div>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => setActiveTab("plan")}>
            템플릿 변경
          </button>
          <button className="solid-button" onClick={() => setActiveTab("map")}>
            <MapIcon size={17} />
            지도
          </button>
        </div>
      </div>
      <DayStrip days={days} selectedDayId={selectedDay.id} setDay={setDay} />

      <div className="today-grid">
        <section className="hero-panel">
          <span className="label">다음 목적지</span>
          <h2>{nextPlace?.koName ?? "코스를 직접 만들어보세요"}</h2>
          <p>{nextPlace?.why ?? "지도나 랭킹에서 장소를 추가하거나, 추천 코스를 선택 적용하면 오늘 루트가 만들어진다."}</p>
          {nextGoogle && (
            <div className="hero-meta">
              <span>
                <Star size={14} /> {nextGoogle.ratingText}
              </span>
              {nextGoogle.reviewCountLabel && <span>{nextGoogle.reviewCountLabel}</span>}
              <span>혼잡 {nextGoogle.crowdLevel}</span>
            </div>
          )}
          {nextPlace && (
            <div className="hero-actions">
              <a className="solid-button compact" href={makeGooglePlaceUrl(nextPlace)} target="_blank" rel="noreferrer">
                <Navigation size={16} />
                구글지도
              </a>
              <button className="ghost-button compact" onClick={() => setActiveTab("map")}>
                <Route size={16} />
                루트
              </button>
            </div>
          )}
        </section>

        <section className="metric-grid">
          <div className="metric">
            <Route size={18} />
            <strong>{formatDistanceKm(stats.km)}</strong>
            <span>직선 합산</span>
          </div>
          <div className="metric">
            <Navigation size={18} />
            <strong>{stats.walkMin}분</strong>
            <span>도보 감각</span>
          </div>
          <div className="metric">
            <AlertTriangle size={18} />
            <strong>{stats.caution}</strong>
            <span>주의 핀</span>
          </div>
          <div className="metric">
            <Star size={18} />
            <strong>{stats.must}</strong>
            <span>필수</span>
          </div>
        </section>
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>오늘 루트</h2>
          <a className={selectedRoute.length ? "text-link" : "text-link muted-link"} href={makeDirectionsUrl(selectedRoute)} target="_blank" rel="noreferrer">
            구글지도 <ExternalLink size={14} />
          </a>
        </div>
        <div className="timeline">
          {selectedRoute.length === 0 && (
            <div className="empty-route">
              <strong>아직 만든 코스가 없어요.</strong>
              <p>추천 코스를 그대로 적용하거나, 지도에서 원하는 장소만 골라 추가하세요.</p>
              <div className="empty-actions">
                <button className="solid-button compact" onClick={() => setActiveTab("map")}>
                  <MapIcon size={15} />
                  지도에서 고르기
                </button>
                <button className="ghost-button compact" onClick={() => setActiveTab("ranking")}>
                  <Plus size={15} />
                  장소 둘러보기
                </button>
              </div>
            </div>
          )}
          {selectedRoute.map((item, index) => {
            const place = getPlace(item.placeId);
            const google = getPlaceScore(place);
            return (
              <div key={item.uid} className={done[item.uid] ? "timeline-item done" : "timeline-item"}>
                <button className="timeline-check" onClick={() => toggleDone(item.uid)}>
                  {done[item.uid] ? <Check size={16} /> : index + 1}
                </button>
                <div className="timeline-detail">
                  <PlaceThumb place={place} order={index + 1} />
                  <div>
                    <strong>{place.koName}</strong>
                    <p>
                      {item.time ? `${item.time} · ` : ""}
                      {place.area} · {place.durationMin}분 · {google.ratingText} · {place.safety}
                    </p>
                    {item.note && <small>{item.note}</small>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="content-band">
        <div className="section-title-row">
          <h2>상황별 선택</h2>
          <Pill>근처 후보</Pill>
        </div>
        <div className="choice-grid">
          {recommendations.slice(0, 3).map(({ place, distance }) => {
            const google = getPlaceScore(place);
            return (
              <article className="choice-card" key={place.id}>
                <span>
                  {categoryLabels[place.category]} · {google.ratingText}
                </span>
                <strong>{place.koName}</strong>
                <small>
                  {formatDistanceKm(distance)} · {place.bestTime} · 혼잡 {google.crowdLevel}
                </small>
                <div className="choice-actions">
                  <a className="text-link" href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
                    구글지도 <ExternalLink size={13} />
                  </a>
                  <button className="ghost-button compact" onClick={() => addToRoute(place.id)}>
                    <Plus size={14} />
                    코스 추가
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {missedPlaces.length > 0 && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>못 간 곳 회수</h2>
            <Pill tone="warn">{missedPlaces.length}</Pill>
          </div>
          <p className="settings-hint">이전 날짜에 넣었지만 완료하지 못한 장소예요. 오늘 코스에 다시 넣을 수 있어요.</p>
          <div className="missed-list">
            {missedPlaces.map((place) => (
              <div className="recommend-item" key={place.id}>
                <button onClick={() => setActiveTab("map")}>
                  <strong>{place.koName}</strong>
                  <small>
                    {categoryLabels[place.category]} · {place.area} · {place.durationMin}분
                  </small>
                </button>
                <IconButton label="오늘 코스에 추가" onClick={() => addToRoute(place.id)}>
                  <Plus size={17} />
                </IconButton>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="content-band">
        <div className="section-title-row">
          <h2>체크</h2>
          <Pill tone="warn">당일</Pill>
        </div>
        <div className="check-list">
          {selectedDay.checklist.length === 0 && (
            <div className="empty-route">
              <strong>오늘 체크리스트가 비어 있어요.</strong>
              <p>일정 탭에서 날짜를 직접 만들었을 때는 필요한 준비물을 직접 메모로 관리하면 됩니다.</p>
            </div>
          )}
          {selectedDay.checklist.map((item) => {
            const key = `${selectedDay.id}::${item}`;
            return (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[key])}
                  onChange={() => setCheckedItems((current) => ({ ...current, [key]: !current[key] }))}
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </section>
    </section>
  );
}
