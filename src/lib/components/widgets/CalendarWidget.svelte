<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { CalendarEvent } from '$lib/types/widget.data';
  import type { WidgetData } from '$lib/types/widget.data';

  interface Props {
    result: WidgetData;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let events = $derived<CalendarEvent[]>(
    (result.data as CalendarEvent[]).map((a) => ({
      ...a,
      start: new Date(a.start),
      end: a.end ? new Date(a.end) : undefined,
    })),
  );
  let currentDate = $state(new Date());
  let selectedDate = $state<Date | null>(null);

  function getMonthData(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Date[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  }

  function formatMonth(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  function formatSelectedDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function prevMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  function selectDate(date: Date | null) {
    if (date) {
      if (date.getMonth() !== currentDate.getMonth()) {
        currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
      if (selectedDate && selectedDate.getTime() === date.getTime()) {
        selectedDate = null;
      } else {
        selectedDate = date;
      }
    }
  }

  let monthDays = $derived(getMonthData(currentDate));
  let selectedDateEvents = $derived(selectedDate ? getEventsForDate(selectedDate) : []);
  let today = $derived(
    new Date().getFullYear() === currentDate.getFullYear() &&
      new Date().getMonth() === currentDate.getMonth()
      ? new Date().getDate()
      : -1,
  );
</script>

<div class="rounded-lg border border-border bg-surface p-4 {className}">
  <div class="mb-4 flex items-center justify-between" transition:slide={{ duration: 300 }}>
    <button
      type="button"
      class="rounded p-1 hover:bg-surface-raised"
      aria-label="Previous month"
      onclick={prevMonth}
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <span class="font-medium">{formatMonth(currentDate)}</span>
    <button
      type="button"
      class="rounded p-1 hover:bg-surface-raised"
      aria-label="Next month"
      onclick={nextMonth}
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  <div class="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
    <div>Sun</div>
    <div>Mon</div>
    <div>Tue</div>
    <div>Wed</div>
    <div>Thu</div>
    <div>Fri</div>
    <div>Sat</div>
  </div>

  <div class="mb-2 grid grid-cols-7 gap-1">
    {#each monthDays as day (day)}
      {@const dayEvents = getEventsForDate(day)}
      {@const isCurrentMonth = day.getMonth() === currentDate.getMonth()}
      {@const isToday = isCurrentMonth && day.getDate() === today}
      {@const isSelected = selectedDate && selectedDate.getTime() === day.getTime()}
      <button
        type="button"
        class="relative flex h-8 flex-col items-center justify-center rounded p-1 hover:bg-surface-raised {isSelected
          ? 'bg-primary/15 ring-2 ring-primary'
          : ''}"
        aria-label="Select {day.getDate()}"
        onclick={() => selectDate(day)}
      >
        <span
          class="text-sm {isCurrentMonth ? '' : 'text-text-muted'} {isToday
            ? 'font-bold text-primary'
            : ''}">{day.getDate()}</span
        >
        {#if dayEvents.length > 0}
          <div class="absolute bottom-0.5 flex justify-center gap-0.5">
            {#each dayEvents.slice(0, 3) as event (event)}
              <span class="h-1 w-1 rounded-full" style="background-color: {event.color}"></span>
            {/each}
          </div>
        {/if}
      </button>
    {/each}
  </div>

  {#if selectedDate}
    <div class="border-t border-border pt-4" transition:slide={{ duration: 300 }}>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-medium">
          {formatSelectedDate(selectedDate)}
        </h3>
        <button
          type="button"
          aria-label="Hide calendar events"
          aria-expanded={selectedDate != null}
          class="text-xs text-text-muted hover:text-text"
          onclick={() => (selectedDate = null)}
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>
      {#if selectedDateEvents.length === 0}
        <p class="text-sm text-text-muted">No events</p>
      {:else}
        <ul class="space-y-2">
          {#each selectedDateEvents as event (event)}
            <li class="flex items-start gap-2 rounded bg-surface-raised p-2">
              <span
                class="mt-1 h-2 w-2 shrink-0 rounded-full"
                style="background-color: {event.color}"
              ></span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{event.title}</p>
                <p class="text-xs text-text-muted">{formatTime(event.start)}</p>
                {#if event.location}
                  <p class="mt-1 truncate text-xs text-text-muted">{event.location}</p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
