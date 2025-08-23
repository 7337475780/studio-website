"use client";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabaseClient";
import "../calendar-dark.css";
import { useEffect, useState } from "react";

interface BookingCalendarProps {
  date: Date;
  setDate: (d: Date) => void;
  time: string;
  setTime: (t: string) => void;
}

export default function BookingCalendar({
  date,
  setDate,
  time,
  setTime,
}: BookingCalendarProps) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Record<string, string[]>>({});

  const timeSlots = Array.from({ length: 10 }, (_, i) => `${9 + i}:00`); // 9:00 - 18:00

  // Fetch booked slots for the month
  useEffect(() => {
    const fetchBooked = async () => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("Bookings")
        .select("date, time")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth)
        .eq("status", "paid");

      if (error) {
        console.error("Error fetching booked dates:", error.message);
        return;
      }

      const map: Record<string, string[]> = {};
      data?.forEach((b) => {
        if (!map[b.date]) map[b.date] = [];
        map[b.date].push(b.time);
      });
      setBookedDates(map);
    };
    fetchBooked();
  }, [date]);

  useEffect(() => {
    const day = date.toISOString().split("T")[0];
    setBookedSlots(bookedDates[day] || []);
  }, [date, bookedDates]);

  const tileContent = ({ date: tileDate }: { date: Date }) => {
    const dayStr = tileDate.toISOString().split("T")[0];
    const bookedTimes = bookedDates[dayStr];
    if (bookedTimes && bookedTimes.length > 0) {
      return (
        <div
          className="mt-1 w-full h-1 bg-red-500 rounded-full"
          title={`Booked times: ${bookedTimes.join(", ")}`}
        />
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl shadow-md max-w-md mx-auto text-white">
      <Calendar
        onChange={(d) => d instanceof Date && setDate(d)}
        value={date}
        minDate={new Date()}
        tileContent={tileContent}
        className="react-calendar dark-calendar rounded-xl shadow-inner"
      />

      <div className="mt-4">
        <label className="block mb-2 font-medium">Select Time:</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700"
        />
        {bookedSlots.includes(time) && (
          <p className="text-red-500 text-sm mt-1">
            This time is already booked.
          </p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Day Schedule</h3>
        <div className="flex flex-wrap gap-2">
          {timeSlots.map((slot) => {
            const isBooked = bookedSlots.includes(slot);
            return (
              <div
                key={slot}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isBooked
                    ? "bg-red-500 text-white cursor-not-allowed"
                    : slot === time
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600 cursor-pointer"
                }`}
                onClick={() => !isBooked && setTime(slot)}
                title={isBooked ? "Booked" : "Available"}
              >
                {slot}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-lg font-semibold">
          Selected:{" "}
          <span className="text-blue-400">
            {date.toDateString()} @ {time}
          </span>
        </p>
      </div>
    </div>
  );
}
