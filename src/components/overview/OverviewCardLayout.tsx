"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Mobile order is DOM order, not CSS-only ordering. The calendar controller
 * lives above this composition; only its presentational cards move between
 * stacks. Width comes from the content area, including sidebar/max-width limits. */
export function OverviewCardLayout({
  calendar,
  recent,
  budget,
  merchants,
  insights,
}: {
  calendar: ReactNode;
  recent: ReactNode;
  budget: ReactNode;
  merchants: ReactNode;
  insights: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // A calendar needs 420px; switching by viewport alone squeezes it beside
    // the persistent sidebar or inside the tablet's centered phone shell.
    const measure = () => setColumns(element.getBoundingClientRect().width >= 856);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  const slots = {
    calendar: (
      <div key="calendar" data-dashboard-slot="calendar">
        {calendar}
      </div>
    ),
    recent: (
      <div key="recent" data-dashboard-slot="recent">
        {recent}
      </div>
    ),
    budget: (
      <div key="budget" data-dashboard-slot="budget">
        {budget}
      </div>
    ),
    merchants: (
      <div key="merchants" data-dashboard-slot="merchants">
        {merchants}
      </div>
    ),
    insights: (
      <div key="insights" data-dashboard-slot="insights" className="dashboard-insights-slot">
        {insights}
      </div>
    ),
  };
  return (
    <div ref={ref} className="dashboard-layout" data-dashboard-columns={columns ? 2 : 1}>
      {columns ? (
        <>
          <div className="dashboard-column">
            {slots.calendar}
            {slots.budget}
            {slots.merchants}
          </div>
          <div className="dashboard-column">
            {slots.recent}
            {slots.insights}
          </div>
        </>
      ) : (
        <>
          {slots.calendar}
          {slots.recent}
          {slots.budget}
          {slots.merchants}
          {slots.insights}
        </>
      )}
    </div>
  );
}
