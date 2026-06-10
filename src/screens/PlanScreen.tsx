import { ChevronRight, ExternalLink, Map as MapIcon, RefreshCw, Sparkles, X } from "lucide-react";
import { activeTemplateRoutes, cityLabels, getPlace, makeDirectionsUrl } from "../appCore";
import type { RouteItem, TabKey, TripDay } from "../appCore";
import { tripTemplates } from "../templates";
import { DayAddForm } from "../components/schedule";
import type { DayInput } from "../components/schedule";
import { IconButton, Pill } from "../components/place";

export default function PlanScreen({
  days,
  selectedDayId,
  setDay,
  routes,
  setActiveTab,
  addDay,
  removeDay,
  applyTemplate,
  applyRecommendedRoute,
}: {
  days: TripDay[];
  selectedDayId: string;
  setDay: (id: string) => void;
  routes: Record<string, RouteItem[]>;
  setActiveTab: (tab: TabKey) => void;
  addDay: (input: DayInput) => void;
  removeDay: (dayId: string) => void;
  applyTemplate: (templateId: string) => void;
  applyRecommendedRoute: (dayId: string) => void;
}) {
  const first = days[0];
  const last = days[days.length - 1];
  const rangeLabel = first && last ? `${first.label} - ${last.label}` : "일정 없음";

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">일정</p>
          <h1>전체 일정</h1>
          <p className="subline">
            {rangeLabel} · {days.length}일 · 날짜 추가/삭제와 코스 편집 모두 가능
          </p>
        </div>
      </div>

      <section className="content-band">
        <div className="section-title-row">
          <h2>여행 템플릿</h2>
          <Pill>4종</Pill>
        </div>
        <p className="settings-hint">
          콘셉트를 고르면 6/19-28 전체 일정과 추천 코스가 다시 채워져요. 적용 후에도 자유롭게 수정할 수 있어요.
        </p>
        <div className="template-row">
          {tripTemplates.map((template) => (
            <article key={template.id} className="template-mini-card">
              <strong>{template.name}</strong>
              <span>{template.tagline}</span>
              <button className="ghost-button compact" onClick={() => applyTemplate(template.id)}>
                <Sparkles size={15} />
                적용
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band">
        <div className="section-title-row">
          <h2>날짜 추가</h2>
          <Pill>커스텀</Pill>
        </div>
        <DayAddForm addDay={addDay} />
      </section>

      <div className="plan-list">
        {days.map((day) => {
          const route = routes[day.id] ?? [];
          const recommended = activeTemplateRoutes()[day.id] ?? [];
          const mustCount = route.filter((item) => getPlace(item.placeId).priority === 1).length;
          return (
            <article key={day.id} className={selectedDayId === day.id ? "day-card active" : "day-card"}>
              <div className="day-card-head-row">
                <button
                  className="day-card-head"
                  onClick={() => {
                    setDay(day.id);
                    setActiveTab("map");
                  }}
                >
                  <span>
                    <small>
                      {day.label} · {cityLabels[day.city]}
                    </small>
                    <strong>{day.title}</strong>
                  </span>
                  <ChevronRight size={20} />
                </button>
                <IconButton
                  label="날짜 삭제"
                  onClick={() => {
                    if (window.confirm(`${day.label} 일정을 삭제할까요? 이 날의 코스도 함께 지워집니다.`)) {
                      removeDay(day.id);
                    }
                  }}
                >
                  <X size={16} />
                </IconButton>
              </div>
              <p>{day.areaFocus}</p>
              <div className="plan-section-label">내 코스</div>
              <div className="mini-route">
                {route.length === 0 && <span>아직 비어 있음</span>}
                {route.slice(0, 7).map((item) => (
                  <span key={item.uid}>{getPlace(item.placeId).koName}</span>
                ))}
              </div>
              <div className="day-card-footer">
                <Pill tone={mustCount > 3 ? "must" : "plain"}>Must {mustCount}</Pill>
                <Pill>{route.length} stops</Pill>
                <a className={route.length ? "" : "muted-link"} href={makeDirectionsUrl(route)} target="_blank" rel="noreferrer">
                  Maps <ExternalLink size={13} />
                </a>
              </div>
              {recommended.length > 0 && (
                <>
                  <div className="plan-section-label">추천안</div>
                  <div className="mini-route recommendation-mini">
                    {recommended.slice(0, 8).map((item) => (
                      <span key={item.uid}>{getPlace(item.placeId).koName}</span>
                    ))}
                  </div>
                </>
              )}
              <div className="card-actions plan-actions">
                {recommended.length > 0 && (
                  <button
                    className="ghost-button compact"
                    onClick={() => {
                      applyRecommendedRoute(day.id);
                      setDay(day.id);
                      setActiveTab("map");
                    }}
                  >
                    <RefreshCw size={16} />
                    추천안 적용
                  </button>
                )}
                <button
                  className="solid-button compact"
                  onClick={() => {
                    setDay(day.id);
                    setActiveTab("map");
                  }}
                >
                  <MapIcon size={16} />
                  직접 편집
                </button>
              </div>
              <div className="fallbacks">
                {day.fallback.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
