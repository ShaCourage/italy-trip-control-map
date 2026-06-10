// 공유 장소 UI — 썸네일/히어로/상세 카드/추천 코스 카드 + 기본 위젯(Pill, IconButton).
// MapScreen·RankingScreen·App(오늘/일정/더보기)이 함께 쓴다.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Camera, ExternalLink, Plus, RefreshCw, Route, Shield, Star } from "lucide-react";
import {
  categoryColors,
  categoryLabels,
  cityLabels,
  formatDistanceKm,
  getEnhancement,
  getOfficialSource,
  getPlace,
  getPlaceScore,
  getShortLabel,
  makeGooglePlaceUrl,
  placesById,
  routeStats,
  sources,
  traitBadges,
} from "../appCore";
import type { Place, RouteItem, TripDay } from "../appCore";
import { categoryShortLabels, PlaceEnhancement } from "../placeEnhancements";

export function Pill({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "must" | "warn" | "ok" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function IconButton({
  label,
  onClick,
  children,
  disabled,
  title,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className="icon-button" onClick={onClick} disabled={disabled} title={title ?? label} aria-label={label}>
      {children}
    </button>
  );
}

export function ClockIcon() {
  return <span className="clock-dot" aria-hidden="true" />;
}

export function DayStrip({ days, selectedDayId, setDay }: { days: TripDay[]; selectedDayId: string; setDay: (id: string) => void }) {
  return (
    <div className="day-strip" aria-label="날짜 선택">
      {days.map((day) => (
        <button key={day.id} className={selectedDayId === day.id ? "day-chip active" : "day-chip"} onClick={() => setDay(day.id)}>
          <span>{day.label}</span>
          <small>{cityLabels[day.city]}</small>
        </button>
      ))}
    </div>
  );
}

type WikiSummary = { url?: string; extract?: string; sourceUrl?: string };

// 같은 장소가 루트/타임라인/카드 여러 곳에서 그려지므로 위키 요청은 1회만
const wikiSummaryCache = new Map<string, Promise<WikiSummary>>();

function fetchWikiSummary(title: string): Promise<WikiSummary> {
  const cached = wikiSummaryCache.get(title);
  if (cached) return cached;
  const request = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    .then((response) => (response.ok ? response.json() : undefined))
    .then((data): WikiSummary => {
      if (!data) return {};
      return {
        url: data.thumbnail?.source ?? data.originalimage?.source,
        extract: data.extract,
        sourceUrl: data.content_urls?.desktop?.page,
      };
    })
    .catch((): WikiSummary => ({}));
  wikiSummaryCache.set(title, request);
  return request;
}

export function usePlaceMedia(place: Place, enhancement: PlaceEnhancement) {
  const [wikiImage, setWikiImage] = useState<WikiSummary>({});
  const imageUrl = enhancement.imageUrl ?? wikiImage.url;
  const sourceUrl = enhancement.imageSourceUrl ?? wikiImage.sourceUrl;

  useEffect(() => {
    let active = true;
    setWikiImage({});
    if (!enhancement.wikiTitle || enhancement.imageUrl) return;

    fetchWikiSummary(enhancement.wikiTitle).then((summary) => {
      if (active) setWikiImage(summary);
    });

    return () => {
      active = false;
    };
  }, [enhancement.imageUrl, enhancement.wikiTitle, place.id]);

  return { imageUrl, extract: wikiImage.extract, sourceUrl };
}

export function PlaceThumb({ place, order }: { place: Place; order?: number }) {
  const enhancement = getEnhancement(place);
  const { imageUrl } = usePlaceMedia(place, enhancement);

  return (
    <span className={imageUrl ? "place-thumb has-image" : "place-thumb"} style={{ ["--thumb-color" as string]: categoryColors[place.category] }}>
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" />
      ) : (
        <>
          <small>{order ?? categoryShortLabels[place.category]}</small>
          <strong>{getShortLabel(place)}</strong>
        </>
      )}
    </span>
  );
}

export function PlaceMediaHero({ place, enhancement }: { place: Place; enhancement: PlaceEnhancement }) {
  const { imageUrl, extract, sourceUrl } = usePlaceMedia(place, enhancement);

  return (
    <div className={imageUrl ? "place-media has-image" : "place-media no-image"} style={{ ["--media-color" as string]: categoryColors[place.category] }}>
      {imageUrl ? (
        <img src={imageUrl} alt={place.koName} loading="lazy" />
      ) : (
        <div>
          <span>{categoryShortLabels[place.category]}</span>
          <strong>{getShortLabel(place)}</strong>
        </div>
      )}
      <div className="place-media-caption">
        <strong>{place.koName}</strong>
        <span>{enhancement.imageCredit ?? (sourceUrl ? "Wikimedia / Wikipedia" : categoryLabels[place.category])}</span>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" aria-label={`${place.koName} 이미지 출처`}>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
      {extract && !enhancement.highlights?.length ? <p>{extract}</p> : null}
    </div>
  );
}

export function PlaceInsightCard({
  place,
  selectedRoute,
  addToRoute,
  replaceNext,
  setSelectedPlaceId,
  note,
  setPlaceNote,
}: {
  place?: Place;
  selectedRoute: RouteItem[];
  addToRoute: (id: string) => void;
  replaceNext: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
  note?: string;
  setPlaceNote?: (placeId: string, text: string) => void;
}) {
  if (!place) return null;

  const enhancement = getEnhancement(place);
  const google = getPlaceScore(place, enhancement);
  const inRoute = selectedRoute.some((item) => item.placeId === place.id);
  const officialSource = getOfficialSource(place);
  const needsReservation = place.reservation === "필수" || place.reservation === "권장";
  const pairPlaces = place.pairWith.map((id) => placesById.get(id)).filter((item): item is Place => Boolean(item)).slice(0, 6);
  const sourceNames = place.sourceIds
    .map((id) => sources.find((source) => source.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);

  return (
    <article className="place-insight">
      <div className="place-insight-head">
        <span className="category-dot" style={{ backgroundColor: categoryColors[place.category] }} />
        <div>
          <small>
            {cityLabels[place.city]} · {categoryLabels[place.category]} · {place.area}
          </small>
          <h2>{place.koName}</h2>
          {place.name && place.name !== place.koName && !place.name.endsWith("placeholder") ? (
            <p className="local-name">{place.name}</p>
          ) : null}
        </div>
        <Pill tone={place.priority === 1 ? "must" : "plain"}>{place.priority === 1 ? "Must" : "Good"}</Pill>
      </div>

      <PlaceMediaHero place={place} enhancement={enhancement} />

      <p>{place.why}</p>

      {enhancement.story ? <p className="place-story">{enhancement.story}</p> : null}

      <div className="trait-row">
        {traitBadges(place).map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>

      <div className="google-review-box">
        <div className="google-score">
          <Star size={18} />
          <strong>{google.rating ? google.rating.toFixed(1) : place.rank}</strong>
          <span>
            {google.isVerified
              ? `Google 평점 · ${google.reviewCountLabel ?? "리뷰 다수"} · ${google.lastChecked ?? "확인일 미기록"} 확인`
              : "내부 추천 점수 · Google 평점은 실시간 확인 권장"}
          </span>
        </div>
        <div className="google-tags">
          <span>{google.priceLevel}</span>
          <span>혼잡 {google.crowdLevel}</span>
          <span>{google.visitConfidence}</span>
        </div>
        <a href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
          실시간 확인 <ExternalLink size={13} />
        </a>
      </div>

      {(officialSource || needsReservation) && (
        <div className="official-box">
          <div>
            <strong>{place.reservation === "필수" ? "예약 필수" : place.reservation === "권장" ? "예약 권장" : "공식 정보"}</strong>
            <span>영업시간·예약은 변동이 잦으니 공식 페이지에서 최종 확인하세요.</span>
          </div>
          {officialSource ? (
            <a className="solid-button compact" href={officialSource.url} target="_blank" rel="noreferrer">
              공식 페이지 <ExternalLink size={13} />
            </a>
          ) : (
            <a className="ghost-button compact" href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
              영업시간 검색 <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      <div className="insight-metrics">
        <span>
          <ClockIcon /> {place.durationMin}분
        </span>
        <span>
          <Camera size={14} /> 사진 {place.photo}
        </span>
        <span>
          <Shield size={14} /> {place.safety}
        </span>
        <span>{place.reservation}</span>
      </div>

      {enhancement.highlights?.length ? (
        <div className="insight-chip-section">
          {enhancement.highlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

      {enhancement.reviewSignals?.length ? (
        <div className="insight-block review-signals">
          <strong>평가에서 자주 갈리는 포인트</strong>
          <ul>
            {enhancement.reviewSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="insight-block">
        <strong>현장 판단</strong>
        <ul>
          {place.tips.slice(0, 2).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
          {(place.koreanTips ?? []).slice(0, 2).map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {place.watchOut?.length ? (
        <div className="watchout-row">
          <AlertTriangle size={15} />
          <span>{place.watchOut.slice(0, 2).join(" · ")}</span>
        </div>
      ) : null}

      {place.menuHints?.length ? (
        <div className="tag-row compact-tags">
          {place.menuHints.slice(0, 4).map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      ) : null}

      {pairPlaces.length ? (
        <div className="pair-box">
          <strong>같이 묶기</strong>
          <div>
            {pairPlaces.map((pair) => (
              <button key={pair.id} onClick={() => setSelectedPlaceId(pair.id)}>
                {pair.koName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {setPlaceNote && (
        <div className="note-box">
          <strong>내 메모</strong>
          <textarea
            value={note ?? ""}
            onChange={(event) => setPlaceNote(place.id, event.target.value)}
            placeholder="예약 번호, 일행 의견, 가고 싶은 이유…"
            rows={2}
          />
        </div>
      )}

      <div className="card-actions">
        <button className="solid-button compact" onClick={() => addToRoute(place.id)} disabled={inRoute}>
          <Plus size={16} />
          {inRoute ? "루트 포함" : "루트 추가"}
        </button>
        <button className="ghost-button compact" onClick={() => replaceNext(place.id)}>
          <Route size={16} />
          다음 교체
        </button>
        <a className="text-link" href={makeGooglePlaceUrl(place)} target="_blank" rel="noreferrer">
          Maps <ExternalLink size={14} />
        </a>
      </div>

      {sourceNames.length ? <small className="source-mini">출처: {sourceNames.join(", ")}</small> : null}
    </article>
  );
}

export function RecommendedRouteCard({
  day,
  recommendedRoute,
  currentRoute,
  applyRecommendedRoute,
  addToRoute,
  setSelectedPlaceId,
}: {
  day: TripDay;
  recommendedRoute: RouteItem[];
  currentRoute: RouteItem[];
  applyRecommendedRoute: (mode?: "replace" | "append") => void;
  addToRoute: (id: string) => void;
  setSelectedPlaceId: (id: string) => void;
}) {
  if (recommendedRoute.length === 0) return null;
  const currentIds = new Set(currentRoute.map((item) => item.placeId));
  const suggestedPlaces = recommendedRoute.map((item) => getPlace(item.placeId));
  const stats = routeStats(recommendedRoute);

  return (
    <article className="recommended-route-card">
      <div className="section-title-row">
        <div>
          <h2>추천 코스</h2>
          <p>
            {day.areaFocus} · {suggestedPlaces.length} stops · {formatDistanceKm(stats.km)}
          </p>
        </div>
        <Pill tone="ok">선택 적용</Pill>
      </div>
      <div className="template-route">
        {recommendedRoute.map((item, index) => {
          const place = getPlace(item.placeId);
          const google = getPlaceScore(place);
          const added = currentIds.has(place.id);
          return (
            <button
              key={item.uid}
              className={added ? "added" : ""}
              onClick={() => setSelectedPlaceId(place.id)}
              title={place.why}
            >
              <span>{index + 1}</span>
              <strong>{place.koName}</strong>
              <small>
                {item.time ?? categoryLabels[place.category]} · {google.ratingText}
              </small>
            </button>
          );
        })}
      </div>
      <div className="card-actions">
        <button className="solid-button compact" onClick={() => applyRecommendedRoute("replace")}>
          <RefreshCw size={16} />
          추천안 적용
        </button>
        <button className="ghost-button compact" onClick={() => applyRecommendedRoute("append")}>
          <Plus size={16} />
          빠진 곳 추가
        </button>
      </div>
      <div className="quick-add-row">
        {recommendedRoute
          .filter((item) => !currentIds.has(item.placeId))
          .slice(0, 4)
          .map((item) => {
            const place = getPlace(item.placeId);
            return (
              <button key={item.uid} onClick={() => addToRoute(place.id)}>
                <Plus size={13} />
                {place.koName}
              </button>
            );
          })}
      </div>
    </article>
  );
}
