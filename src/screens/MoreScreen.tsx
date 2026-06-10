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
  Settings as SettingsIcon,
  Shield,
  Star,
  Train,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { packingChecklist, phraseGroups, safetyNotes } from "../data";
import { foodOrderGuides, koreanTravelGuides } from "../extraData";
import {
  categoryLabels,
  cityLabels,
  getEnhancement,
  getPlaceScore,
  makeGooglePlaceUrl,
  modeLabels,
  places,
  sources,
} from "../appCore";
import type { AppSettings, ModeKey, TabKey } from "../appCore";
import { IconButton, Pill } from "../components/place";
import { docTypeLabels, normalizeDocUrl } from "../lib/docs";
import type { DocType, TripDoc, TripDocInput } from "../lib/docs";

export type MoreKey = "safety" | "foodGuide" | "phrases" | "checklist" | "docs" | "data";

const tabOptions: { key: TabKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "map", label: "지도" },
  { key: "ranking", label: "장소" },
  { key: "plan", label: "템플릿" },
  { key: "more", label: "더보기" },
];

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
      "Name",
      "Description",
      "Latitude",
      "Longitude",
      "Category",
      "Priority",
      "City",
      "Google Rating (verified)",
      "Review Count (verified)",
      "Price Level",
      "Crowd Estimate",
      "Confidence",
      "Highlights",
      "Google Maps",
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
          place.priority === 1 ? "Must" : "Good",
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
}) {
  const [docFilter, setDocFilter] = useState<DocType | "all">("all");
  const [editingDocId, setEditingDocId] = useState<string>();
  const filteredDocs = docs.filter((doc) => docFilter === "all" || doc.type === docFilter);
  const sections: { key: MoreKey; label: string; icon: ElementType }[] = [
    { key: "safety", label: "안전·꿀팁", icon: Shield },
    { key: "foodGuide", label: "음식", icon: Utensils },
    { key: "phrases", label: "회화", icon: Languages },
    { key: "checklist", label: "체크", icon: ListChecks },
    { key: "docs", label: "문서함", icon: FileText },
    { key: "data", label: "데이터·설정", icon: SettingsIcon },
  ];

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">More</p>
          <h1>안전, 회화, 설정</h1>
          <p className="subline">현장에서 자주 쓰는 것 + 숙소·백업 설정</p>
        </div>
      </div>

      <div className="more-tabs">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button key={section.key} className={moreSection === section.key ? "active" : ""} onClick={() => setMoreSection(section.key)}>
              <Icon size={17} />
              {section.label}
            </button>
          );
        })}
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

      {moreSection === "data" && (
        <div className="info-list">
          <section className="content-band settings-panel">
            <div className="section-title-row">
              <h2>숙소 설정</h2>
              <Pill tone="warn">루트 기준점</Pill>
            </div>
            <p className="settings-hint">
              Google Maps에서 숙소를 길게 눌러 나오는 좌표를 복사해 붙여넣으세요. 모든 거리·루트·숙소 복귀가 이
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
                  value={settings.startTab ?? "map"}
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
                기본 모드
                <select
                  value={settings.defaultMode ?? "default"}
                  onChange={(event) => updateSettings({ defaultMode: event.target.value as ModeKey })}
                >
                  {Object.entries(modeLabels).map(([key, label]) => (
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
              <Pill>Google My Maps</Pill>
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
                <strong>{places.filter((place) => place.priority <= 2).length}</strong>
                <span>핀</span>
              </div>
              <div>
                <Star size={20} />
                <strong>{places.filter((place) => place.priority === 1).length}</strong>
                <span>Must</span>
              </div>
              <div>
                <Train size={20} />
                <strong>2</strong>
                <span>도시</span>
              </div>
            </div>
          </section>

          <section className="content-band">
            <div className="section-title-row">
              <h2>출처</h2>
              <Pill>{sources.length}</Pill>
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
