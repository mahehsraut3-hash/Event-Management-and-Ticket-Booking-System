import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, User, Ticket as TicketIcon, Download, Printer, CheckCircle2, XCircle } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(dateString));
};

const TicketCard = ({ ticket }) => {
  const ticketRef = useRef(null);

  if (!ticket) return null;

  const event = ticket.event || {};
  const user = ticket.user || {};
  const isUsed = ticket.isUsed;

  // Print ticket
  const handlePrint = () => {
    window.print();
  };

  // Download ticket as PNG via canvas
  const handleDownload = () => {
    const svgElement = ticketRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20, 360, 360);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${ticket.ticketCode || 'ticket'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      ref={ticketRef}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden max-w-xl mx-auto print:shadow-none print:border-slate-800"
    >
      {/* Top Banner with Notch */}
      <div className="relative bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {event.category || 'Live Event'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
              {event.title}
            </h2>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Admission Tier
            </span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-300">
              {ticket.ticketTypeName}
            </span>
          </div>
        </div>

        {/* Date & Location */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span>{formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}, {event.city}</span>
          </div>
        </div>
      </div>

      {/* Perforated Divider */}
      <div className="relative flex items-center justify-between bg-white px-2 py-1">
        <div className="w-4 h-8 bg-slate-100 rounded-r-full -ml-2 border-r border-slate-200"></div>
        <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-3"></div>
        <div className="w-4 h-8 bg-slate-100 rounded-l-full -mr-2 border-l border-slate-200"></div>
      </div>

      {/* Ticket Body & QR Code */}
      <div className="p-6 sm:p-7 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* QR Code Container */}
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-inner">
              <QRCodeSVG
                value={ticket.qrData || ticket.ticketCode}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">
              Scan at Gate
            </span>
          </div>

          {/* Attendee Details & Code */}
          <div className="flex-1 w-full sm:w-auto space-y-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Ticket Holder
              </span>
              <span className="text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-indigo-600" />
                {user.name || 'Event Attendee'}
              </span>
              <span className="text-xs text-slate-500 block">{user.email}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Official Ticket Code
              </span>
              <span className="text-sm font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block mt-0.5 border border-indigo-100">
                {ticket.ticketCode}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Pass Status
              </span>
              {isUsed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" /> Checked In ({new Date(ticket.usedAt).toLocaleTimeString()})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Valid & Ready for Entry
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printed) */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download QR (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
