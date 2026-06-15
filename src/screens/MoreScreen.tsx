import { useState } from "react";
import type { Dispatch, ElementType, SetStateAction } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Languages,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Star,
  Train,
  Upload,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { packingChecklist, phraseGroups, safetyNotes } from "../data";
import { foodOrderGuides, koreanTravelGuides } from "../extraData";
import {
  categoryLabels,
  cityLabels,
  filterLabels,
  getEnhancement,
  getPlaceScore,
  makeGooglePlaceUrl,
  placeStats,
  places,
  sources,
} from "../appCore";
import type { AppSettings, FilterKey, TabKey, TripDay } from "../appCore";
import { IconButton, Pill } from "../components/place";
import { docTypeLabels, normalizeDocUrl } from "../lib/docs";
import type { DocType, TripDoc, TripDocInput } from "../lib/docs";
import {
  budgetCategories,
  formatAmount,
  formatTotals,
  sumByCurrency,
} from "../lib/budget";
import type { BudgetCategory, BudgetCurrency, BudgetEntry } from "../lib/budget";

export type MoreKey = "safety" | "foodGuide" | "phrases" | "checklist" | "docs" | "budget" | "data";

const tabOptions: { key: TabKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "map", label: "지도" },
  { key: "plan", label: "일정" },
  { key: "ranking", label: "장소" },
  { key: "more", label: "도구" },
];

// 서비스워커·캐시를 비우고 새로고침 — 옛 캐시에 갇힌 기기의 탈출구
async function hardRefresh() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // 실패해도 새로고침은 시도
  }
  window.location.reload();
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = [
    [
      "장소명",
      "설명",
      "위도",
      "경도",
      "카테고리",
      "우선순위",
      "도시",
      "검증된 구글 평점",
      "검증된 리뷰 수",
      "가격대",
      "혼잡도",
      "검증 강도",
      "특징",
      "구글지도",
    ],
    ...places
      .filter((place) => place.priority <= 2)
      .map((place) => {
        const enhancement = getEnhancement(place);
        const google = getPlaceScore(place, enhancement);
        return [
          place.koName,
          `${categoryLabels[place.category]} | ${place.area} | ${place.why}`,
          place.lat,
          place.lng,
          categoryLabels[place.category],
          place.priority === 1 ? "필수" : "추천",
          cityLabels[place.city],
          google.rating?.toFixed(1) ?? "",
          google.reviewCountLabel ?? "",
          google.priceLevel,
          google.crowdLevel,
          google.visitConfidence,
          enhancement.highlights?.join(" | ") ?? "",
          makeGooglePlaceUrl(place),
        ];
      }),
  ];

  downloadFile("italy-trip-map.csv", rows.map((row) => row.map(escapeCsv).join(",")).join("\n"), "text/csv;charset=utf-8");
}

function exportKml() {
  const placemarks = places
    .filter((place) => place.priority <= 2)
    .map((place) => {
      const google = getPlaceScore(place);
      return `<Placemark>
  <name>${place.koName}</name>
  <description>${categoryLabels[place.category]} | ${place.area} | ${google.ratingText}${google.reviewCountLabel ? ` | ${google.reviewCountLabel}` : ""} | ${place.why}</description>
  <Point><coordinates>${place.lng},${place.lat},0</coordinates></Point>
</Placemark>`;
    })
    .join("\n");

  downloadFile(
    "italy-trip-map.kml",
    `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<name>Italy Trip Control Map</name>
${placemarks}
</Document>
</kml>`,
    "application/vnd.google-earth.kml+xml;charset=utf-8"
  );
}

function DocForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TripDoc;
  onSave: (input: TripDocInput) => void;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<DocType>(initial?.type ?? "ticket");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [error, setError] = useState("");

  return (
    <div className="custom-place-form doc-form">
      <select value={type} onChange={(event) => setType(event.target.value as DocType)} aria-label="문서 유형">
        {(Object.keys(docTypeLabels) as DocType[]).map((key) => (
          <option key={key} value={key}>
            {docTypeLabels[key]}
          </option>
        ))}
      </select>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목 (예: 콜로세움 예약)" />
      <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="링크 (선택)" inputMode="url" />
      <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모 (예: 예약번호, 입장 시간)" />
      {error && <p className="form-error">{error}</p>}
      <div className="doc-form-actions">
        <button
          className="solid-button compact"
          disabled={!title.trim()}
          onClick={() => {
            if (!title.trim()) return;
            try {
              const normalizedUrl = normalizeDocUrl(url);
              onSave({
                type,
                title: title.trim(),
                url: normalizedUrl,
                memo: memo.trim() || undefined,
              });
              setError("");
              if (!initial) {
                setTitle("");
                setUrl("");
                setMemo("");
              }
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "링크 형식을 확인해주세요.");
            }
          }}
        >
          {initial ? <Check size={15} /> : <Plus size={15} />}
          {initial ? "수정 저장" : "문서 추가"}
        </button>
        {onCancel && (
          <button className="ghost-button compact" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </div>
  );
}

function HotelSettingForm({
  city,
  current,
  onSave,
}: {
  city: string;
  current?: { lat: number; lng: number; label?: string };
  onSave: (value: { lat: number; lng: number; label?: string }) => void;
}) {
  const [coords, setCoords] = useState(current ? `${current.lat}, ${current.lng}` : "");
  const [label, setLabel] = useState(current?.label ?? "");
  const match = coords.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);

  return (
    <div className="hotel-form">
      <strong>{city} 숙소</strong>
      <input
        value={coords}
        onChange={(event) => setCoords(event.target.value)}
        placeholder="위도, 경도 붙여넣기 (예: 41.9001, 12.4905)"
        inputMode="text"
      />
      <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="숙소 이름 (선택)" />
      <button
        className="solid-button compact"
        disabled={!match}
        onClick={() => {
          if (!match) return;
          onSave({ lat: parseFloat(match[1]), lng: parseFloat(match[2]), label: label.trim() || undefined });
        }}
      >
        <Check size={15} /> 저장
      </button>
    </div>
  );
}

export default function MoreScreen({
  moreSection,
  setMoreSection,
  checkedItems,
  setCheckedItems,
  copyPhrase,
  settings,
  updateSettings,
  exportBackup,
  importBackup,
  docs,
  addDoc,
  updateDoc,
  removeDoc,
  budget,
  addBudgetEntry,
  removeBudgetEntry,
  days,
}: {
  moreSection: MoreKey;
  setMoreSection: (key: MoreKey) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
  copyPhrase: (text: string) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  exportBackup: () => void;
  importBackup: (file: File) => void;
  docs: TripDoc[];
  addDoc: (input: TripDocInput) => void;
  updateDoc: (docId: string, input: TripDocInput) => void;
  removeDoc: (docId: string) => void;
  budget: BudgetEntry[];
  addBudgetEntry: (input: Omit<BudgetEntry, "id">) => void;
  removeBudgetEntry: (id: string) => void;
  days: TripDay[];
}) {
  const [docFilter, setDocFilter] = useState<DocType | "all">("all");
  const [editingDocId, setEditingDocId] = useState<string>();
  const filteredDocs = docs.filter((doc) => docFilter === "all" || doc.type === docFilter);
  const sectionGroups: { label: string; sections: { key: MoreKey; label: string; icon: ElementType }[] }[] = [
    {
      label: "현장",
      sections: [
        { key: "safety", label: "안전", icon: Shield },
        { key: "foodGuide", label: "음식", icon: Utensils },
        { key: "phrases", label: "회화", icon: Languages },
      ],
    },
    {
      label: "관리",
      sections: [
        { key: "checklist", label: "준비물", icon: ListChecks },
        { key: "docs", label: "문서", icon: FileText },
        { key: "budget", label: "예산", icon: Wallet },
      ],
    },
    {
      label: "설정",
      sections: [{ key: "data", label: "설정", icon: SettingsIcon }],
    },
  ];

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">도구</p>
          <h1>여행 도구</h1>
          <p className="subline">현장에서는 안전·회화, 준비할 때는 문서·예산·설정을 빠르게</p>
        </div>
      </div>

      <div className="more-menu" aria-label="도구 메뉴">
        {sectionGroups.map((group) => (
          <div className="more-menu-group" key={group.label}>
            <span className="more-menu-title">{group.label}</span>
            <div className="more-tabs">
              {group.sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button key={section.key} className={moreSection === section.key ? "active" : ""} onClick={() => setMoreSection(section.key)}>
                    <Icon size={17} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {moreSection === "safety" && (
        <div className="info-list">
          <article className="info-card emergency-card">
            <div className="section-title-row">
              <h2>비상 연락</h2>
              <Pill tone="warn">112</Pill>
            </div>
            <p>EU 긴급번호 112. 도난/분실은 숙소 프런트, 경찰서, 카드사 앱 순서로 처리.</p>
            <p>주이탈리아 대한민국 대사관: 대표 +39 06 420 402 1, 근무시간 외 긴급 +39 335 185 0499.</p>
          </article>
          {safetyNotes.map((note) => (
            <article key={note.title} className="info-card">
              <div className="section-title-row">
                <h2>{note.title}</h2>
                <Pill tone={note.severity === "높음" ? "warn" : "plain"}>{note.severity}</Pill>
              </div>
              <p>{note.detail}</p>
            </article>
          ))}
          {koreanTravelGuides.map((guide) => (
            <article key={guide.title} className="info-card">
              <div className="section-title-row">
                <h2>{guide.title}</h2>
                <Pill tone="ok">꿀팁</Pill>
              </div>
              <ul className="guide-list">
                {guide.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      {moreSection === "foodGuide" && (
        <div className="info-list">
          {foodOrderGuides.map((guide) => (
            <article key={guide.title} className="info-card">
              <div className="section-title-row">
                <h2>{guide.title}</h2>
                <Pill>{guide.city}</Pill>
              </div>
              <ul className="guide-list">
                {guide.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      {moreSection === "phrases" && (
        <div className="phrase-list">
          {phraseGroups.map((group) => (
            <section key={group.title} className="content-band">
              <div className="section-title-row">
                <h2>{group.title}</h2>
                <Pill>{group.lines.length}</Pill>
              </div>
              {group.lines.map((line) => (
                <div className="phrase-row" key={line.it}>
                  <button onClick={() => copyPhrase(line.it)}>
                    <strong>{line.it}</strong>
                    <span>{line.sound}</span>
                    <small>{line.ko}</small>
                  </button>
                  <IconButton label="복사" onClick={() => copyPhrase(line.it)}>
                    <Copy size={16} />
                  </IconButton>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {moreSection === "checklist" && (
        <section className="content-band">
          <div className="section-title-row">
            <h2>준비물</h2>
            <Pill>{packingChecklist.filter((item) => checkedItems[item]).length}/{packingChecklist.length}</Pill>
          </div>
          <div className="check-list large">
            {packingChecklist.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[item])}
                  onChange={() => setCheckedItems((current) => ({ ...current, [item]: !current[item] }))}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {moreSection === "docs" && (
        <div className="info-list">
          <section className="content-band">
            <div className="section-title-row">
              <h2>예약·티켓 모음</h2>
              <Pill>{docs.length}</Pill>
            </div>
            <p className="settings-hint">
              항공권, 기차, 미술관 예약의 링크와 번호를 모아두는 곳이에요. 여권 사본 같은 민감한 원본은 넣지
              마세요.
            </p>
            <DocForm onSave={addDoc} />
          </section>
          <div className="filter-row doc-filter" aria-label="문서 유형 필터">
            {(["all", ...Object.keys(docTypeLabels)] as (DocType | "all")[]).map((type) => (
              <button
                key={type}
                className={docFilter === type ? "filter-chip active" : "filter-chip"}
                onClick={() => setDocFilter(type)}
              >
                {type === "all" ? `전체 ${docs.length}` : `${docTypeLabels[type]} ${docs.filter((doc) => doc.type === type).length}`}
              </button>
            ))}
          </div>
          {docs.length === 0 && (
            <article className="info-card">
              <p>아직 저장된 문서가 없어요. 예약 확정 메일의 링크나 예약 번호부터 추가해보세요.</p>
            </article>
          )}
          {docs.length > 0 && filteredDocs.length === 0 && (
            <article className="info-card">
              <p>이 유형으로 저장된 문서가 없어요.</p>
            </article>
          )}
          {filteredDocs.map((doc) => (
            <article key={doc.id} className="info-card doc-card">
              {editingDocId === doc.id ? (
                <DocForm
                  key={doc.id}
                  initial={doc}
                  onSave={(input) => {
                    updateDoc(doc.id, input);
                    setEditingDocId(undefined);
                  }}
                  onCancel={() => setEditingDocId(undefined)}
                />
              ) : (
                <>
                  <div className="section-title-row">
                    <div className="doc-title">
                      <Pill>{docTypeLabels[doc.type]}</Pill>
                      <h2>{doc.title}</h2>
                    </div>
                    <div className="doc-card-actions">
                      <IconButton label="문서 수정" onClick={() => setEditingDocId(doc.id)}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        label="문서 삭제"
                        onClick={() => {
                          if (window.confirm(`'${doc.title}' 문서를 삭제할까요?`)) removeDoc(doc.id);
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </div>
                  </div>
                  {doc.memo && <p>{doc.memo}</p>}
                  {doc.url && (
                    <a className="text-link" href={doc.url} target="_blank" rel="noreferrer">
                      열기 <ExternalLink size={14} />
                    </a>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {moreSection === "budget" && (
        <BudgetSection budget={budget} addBudgetEntry={addBudgetEntry} removeBudgetEntry={removeBudgetEntry} days={days} />
      )}

      {moreSection === "data" && (
        <div className="info-list">
          <section className="content-band settings-panel">
            <div className="section-title-row">
              <h2>숙소 설정</h2>
              <Pill tone="warn">루트 기준점</Pill>
            </div>
            <p className="settings-hint">
              구글지도에서 숙소를 길게 눌러 나오는 좌표를 복사해 붙여넣으세요. 모든 거리·루트·숙소 복귀가 이
              좌표 기준으로 다시 계산됩니다.
            </p>
            <HotelSettingForm city="로마" current={settings.romeHotel} onSave={(value) => updateSettings({ romeHotel: value })} />
            <HotelSettingForm
              city="피렌체"
              current={settings.florenceHotel}
              onSave={(value) => updateSettings({ florenceHotel: value })}
            />
            <div className="settings-row">
              <label>
                시작 화면
                <select
                  value={settings.startTab ?? "today"}
                  onChange={(event) => updateSettings({ startTab: event.target.value as TabKey })}
                >
                  {tabOptions.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                기본 필터
                <select
                  value={settings.defaultFilter ?? "all"}
                  onChange={(event) => updateSettings({ defaultFilter: event.target.value as FilterKey })}
                >
                  {Object.entries(filterLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="content-band export-panel">
            <div className="section-title-row">
              <h2>앱 업데이트</h2>
              <Pill tone="warn">문제 해결</Pill>
            </div>
            <p className="settings-hint">
              새 기능이 안 보이거나 화면이 옛날 같으면 누르세요. 캐시를 비우고 최신으로 다시 불러옵니다.
              (저장된 일정·설정은 유지됩니다)
            </p>
            <div className="export-actions">
              <button className="solid-button" onClick={hardRefresh}>
                <RefreshCw size={17} />
                최신으로 새로고침
              </button>
            </div>
          </section>

          <section className="content-band export-panel">
            <div className="section-title-row">
              <h2>백업</h2>
              <Pill>JSON</Pill>
            </div>
            <p className="settings-hint">루트·완료 체크·설정을 파일로 저장하고, 다른 기기에서 복원합니다.</p>
            <div className="export-actions">
              <button className="solid-button" onClick={exportBackup}>
                <Download size={17} />
                백업 저장
              </button>
              <label className="ghost-button file-button">
                <Upload size={17} />
                복원
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importBackup(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          <section className="content-band export-panel">
            <div className="section-title-row">
              <h2>지도 파일</h2>
              <Pill>구글 내 지도</Pill>
            </div>
            <div className="export-actions">
              <button className="solid-button" onClick={exportCsv}>
                <Download size={17} />
                CSV
              </button>
              <button className="ghost-button" onClick={exportKml}>
                <Download size={17} />
                KML
              </button>
            </div>
            <div className="export-grid">
              <div>
                <MapPin size={20} />
                <strong>{placeStats.total}</strong>
                <span>전체 장소</span>
              </div>
              <div>
                <Star size={20} />
                <strong>{placeStats.listable}</strong>
                <span>목록 표시</span>
              </div>
              <div>
                <Train size={20} />
                <strong>{placeStats.priorityPins}</strong>
                <span>중요 핀</span>
              </div>
              <div>
                <Star size={20} />
                <strong>{placeStats.withEnhancement}</strong>
                <span>보강 정보</span>
              </div>
              <div>
                <Pencil size={20} />
                <strong>{placeStats.withoutEnhancement}</strong>
                <span>미보강</span>
              </div>
              <div>
                <FileText size={20} />
                <strong>{placeStats.withWikiTitle}</strong>
                <span>위키 제목</span>
              </div>
              <div>
                <Star size={20} />
                <strong>{placeStats.withGoogle}</strong>
                <span>확인 평점</span>
              </div>
              <div>
                <FileText size={20} />
                <strong>{placeStats.withImage}</strong>
                <span>실사진</span>
              </div>
              <div>
                <FileText size={20} />
                <strong>{placeStats.withoutImage}</strong>
                <span>사진 없음</span>
              </div>
              <div>
                <Shield size={20} />
                <strong>{placeStats.withOfficialSource}</strong>
                <span>공식 출처</span>
              </div>
              <div>
                <FileText size={20} />
                <strong>{placeStats.sources}</strong>
                <span>출처</span>
              </div>
            </div>
          </section>

          <section className="content-band">
            <div className="section-title-row">
              <h2>출처</h2>
              <Pill>{placeStats.sources}</Pill>
            </div>
            <div className="source-list">
              {sources.map((source) => (
                <a key={source.id} className="source-row" href={source.url} target="_blank" rel="noreferrer">
                  <span>
                    <strong>{source.label}</strong>
                    <small>{source.note}</small>
                  </span>
                  <ExternalLink size={16} />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function localISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function BudgetSection({
  budget,
  addBudgetEntry,
  removeBudgetEntry,
  days,
}: {
  budget: BudgetEntry[];
  addBudgetEntry: (input: Omit<BudgetEntry, "id">) => void;
  removeBudgetEntry: (id: string) => void;
  days: TripDay[];
}) {
  const todayDefault = days.find((day) => day.id === localISODate())?.date ?? days[0]?.date ?? localISODate();
  const [date, setDate] = useState(todayDefault);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<BudgetCurrency>("EUR");
  const [category, setCategory] = useState<BudgetCategory>("식비");

  const amountValue = parseFloat(amount);
  const canAdd = label.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0 && Boolean(date);

  // 날짜별 그룹 (최신 날짜 먼저)
  const byDate = new Map<string, BudgetEntry[]>();
  for (const entry of budget) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }
  const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
  const grandTotal = sumByCurrency(budget);

  return (
    <div className="info-list">
      <section className="content-band">
        <div className="section-title-row">
          <h2>지출 기록</h2>
          <Pill tone="ok">합계 {formatTotals(grandTotal)}</Pill>
        </div>
        <p className="settings-hint">하루에 얼마 썼는지 가볍게 적는 메모예요. EUR·KRW는 환율로 합치지 않고 따로 더합니다.</p>
        <div className="budget-form">
          <div className="budget-form-row">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="날짜" />
            <select value={category} onChange={(event) => setCategory(event.target.value as BudgetCategory)} aria-label="분류">
              {budgetCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="내용 (예: 점심 파스타)" />
          <div className="budget-form-row">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="금액"
              inputMode="decimal"
            />
            <select value={currency} onChange={(event) => setCurrency(event.target.value as BudgetCurrency)} aria-label="통화">
              <option value="EUR">€ EUR</option>
              <option value="KRW">₩ KRW</option>
            </select>
          </div>
          <button
            className="solid-button compact"
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              addBudgetEntry({ date, label: label.trim(), amount: amountValue, currency, category });
              setLabel("");
              setAmount("");
            }}
          >
            <Plus size={15} /> 지출 추가
          </button>
        </div>
      </section>

      {budget.length === 0 && (
        <article className="info-card">
          <p>아직 기록한 지출이 없어요. 식비·교통·입장권부터 가볍게 적어보세요.</p>
        </article>
      )}

      {sortedDates.map((d) => {
        const entries = byDate.get(d) ?? [];
        const dayLabel = days.find((day) => day.date === d)?.label ?? d;
        const dayTotal = sumByCurrency(entries);
        return (
          <section className="content-band" key={d}>
            <div className="section-title-row">
              <h2>{dayLabel}</h2>
              <Pill>{formatTotals(dayTotal)}</Pill>
            </div>
            <div className="budget-list">
              {entries.map((entry) => (
                <div className="budget-item" key={entry.id}>
                  <div>
                    <strong>{entry.label}</strong>
                    <small>{entry.category}</small>
                  </div>
                  <span className="budget-amount">{formatAmount(entry.amount, entry.currency)}</span>
                  <IconButton label="삭제" onClick={() => removeBudgetEntry(entry.id)}>
                    <X size={15} />
                  </IconButton>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
