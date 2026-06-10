import { useState } from "react";
import { Plus } from "lucide-react";
import { cityLabels } from "../data";
import type { City } from "../data";

export type DayInput = {
  date: string;
  city: City;
  title?: string;
};

export function DayAddForm({ addDay }: { addDay: (input: DayInput) => void }) {
  const [date, setDate] = useState("");
  const [city, setCity] = useState<City>("rome");
  const [title, setTitle] = useState("");

  return (
    <div className="day-add-form">
      <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="날짜" />
      <select value={city} onChange={(event) => setCity(event.target.value as City)} aria-label="도시">
        {(Object.keys(cityLabels) as City[]).map((key) => (
          <option key={key} value={key}>
            {cityLabels[key]}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="제목 (예: 바티칸 + 트라스테베레)"
        aria-label="일정 제목"
      />
      <button
        className="solid-button compact"
        disabled={!date}
        onClick={() => {
          if (!date) return;
          addDay({ date, city, title });
          setDate("");
          setTitle("");
        }}
      >
        <Plus size={15} />
        날짜 추가
      </button>
    </div>
  );
}
