import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Search,
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar,
  Volume2,
  VolumeX,
  Keyboard
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

// Synthesize pleasant sound effects using Web Audio API
const playSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'valid') {
      // Pleasant high-pitched two-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      // Low buzz for errors / rejected tickets
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio synthesis not permitted or unavailable
  }
};

const ScannerPage = () => {
  const { user } = useAuth();

  // Events list & selected gate event
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validation Result Modal: null | { result: 'VALID'|'ALREADY_USED'|'WRONG_EVENT'|'INVALID', message, ticket }
  const [scanResult, setScanResult] = useState(null);

  const html5QrCodeRef = useRef(null);
  const readerElementId = 'qr-reader-container';

  // Fetch available events for the organizer
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await api.get('/events?limit=30');
        if (res.data?.success && res.data?.data?.events) {
          const list = res.data.data.events;
          setEvents(list);
          if (list.length > 0) {
            setSelectedEventId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading organizer events for scanner:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();

    return () => {
      stopCameraScanner();
    };
  }, []);

  // Stop camera instance
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Start camera scanner
  const startCameraScanner = async () => {
    if (!selectedEventId) {
      setScanError('Please select an event before starting the camera.');
      return;
    }

    setScanError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success callback on decoded QR code
          handleValidateScannedData(decodedText);
        },
        (errorMessage) => {
          // Parsing frame, harmless ignored
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setScanError(
        'Unable to access camera. Please check browser permissions or use the manual code entry option below.'
      );
      setIsScanning(false);
    }
  };

  // Validate scanned QR code data
  const handleValidateScannedData = async (scannedPayload) => {
    // Temporarily pause scanner while validating
    stopCameraScanner();
    performValidation({ qrData: scannedPayload });
  };

  // Validate manual ticket code
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    performValidation({ ticketCode: manualCode.trim() });
  };

  // Central validation call
  const performValidation = async (payload) => {
    setIsValidating(true);
    try {
      const res = await api.post('/tickets/validate', {
        ...payload,
        eventId: selectedEventId
      });

      const data = res.data;
      setScanResult(data);

      if (data.result === 'VALID') {
        playSound('valid');
      } else {
        playSound('invalid');
      }
    } catch (err) {
      const errorData = err.response?.data || {
        result: 'INVALID',
        message: err.message || 'Validation request failed'
      };
      setScanResult(errorData);
      playSound('invalid');
    } finally {
      setIsValidating(false);
      setManualCode('');
    }
  };

  // Dismiss result and restart camera for next attendee
  const handleNextScan = () => {
    setScanResult(null);
    startCameraScanner();
  };

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <QrCode className="w-3.5 h-3.5" /> Gate Check-In Terminal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            QR Ticket Validator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time gate admission scanner with cryptographic signature verification.
          </p>
        </div>

        {/* Selected Gate Event Badge */}
        {selectedEvent && (
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-xs text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Active Gate
            </span>
            <span className="text-sm font-bold text-slate-900 line-clamp-1">
              {selectedEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* Step 1: Select Event Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm mb-8">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Select Event to Validate For
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            stopCameraScanner();
          }}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        >
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} ({ev.city}) • {new Date(ev.startDateTime).toLocaleDateString()}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-400 mt-2 block">
          Tickets issued for any other event will be immediately flagged as <b>WRONG_EVENT</b>.
        </span>
      </div>

      {/* Step 2: Camera Scanner & Manual Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Camera Viewfinder Column */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 self-start">
            <Camera className="w-4 h-4 text-indigo-600" /> Live Camera Scanner
          </h2>

          {/* Video Container Target */}
          <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <div id={readerElementId} className="w-full h-full"></div>

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900">
                <QrCode className="w-16 h-16 text-slate-600 mb-3" />
                <span className="text-sm font-semibold text-slate-300">Camera is Inactive</span>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Click below to enable your camera feed and scan attendee QR passes.
                </p>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {scanError && (
            <div className="w-full mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Camera Toggle Button */}
          <div className="mt-5 w-full">
            {!isScanning ? (
              <button
                type="button"
                onClick={startCameraScanner}
                disabled={!selectedEventId}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCameraScanner}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs"
              >
                <CameraOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Manual Code Entry Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-600" /> Manual Code Fallback
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              If the device camera has difficulty reading a cracked screen or damaged printout, enter the alphanumeric ticket code directly.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Ticket Alphanumeric Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. TBS-MUM-8F92-K4A1"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isValidating || !manualCode.trim()}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Validate Ticket Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Validation Legend Card */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-3 text-xs text-slate-600">
            <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">
              Gate Verification Outcomes
            </span>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <span><b>VALID</b>: Cryptographic signature verified & marked checked-in.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></span>
              <span><b>ALREADY_USED</b>: Ticket was previously scanned. Entry barred.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
              <span><b>WRONG_EVENT</b>: Ticket is valid, but issued for another event.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-600 flex-shrink-0"></span>
              <span><b>INVALID</b>: Signature check failed or forged ticket code.</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN RESULT MODAL OVERLAY */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 text-center transform transition-all scale-100">
            {/* GREEN SCREEN: VALID */}
            {scanResult.result === 'VALID' && (
              <div className="bg-emerald-600 text-white p-8 sm:p-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200 block">
                  Gate Verification
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-1">
                  ENTRY GRANTED
                </h2>
                <p className="mt-2 text-sm text-emerald-100 font-medium">
                  {scanResult.message}
                </p>

                {/* Attendee Info Card */}
                {scanResult.ticket && (
                  <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 text-left border border-white/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Attendee</span>
                      <span className="font-bold text-white text-sm">{scanResult.ticket.attendeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Admission Tier</span>
                      <span className="font-bold text-white">{scanResult.ticket.tierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Ticket Code</span>
                      <span className="font-mono font-bold text-white">{scanResult.ticket.ticketCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Checked In</span>
                      <span className="font-bold text-white">{new Date(scanResult.ticket.checkInTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNextScan}
                  className="mt-8 w-full py-4 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl font-extrabold text-base transition shadow-lg"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}

            {/* RED SCREEN: ALREADY_USED */}
            {scanResult.result === 'ALREADY_USED' && (
              <div className="bg-rose-600 text-white p-8 sm:p-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-white" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-rose-200 block">
                  Check-In Denied
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-1">
                  ALREADY USED
                </h2>
                <p className="mt-2 text-sm text-rose-100 font-medium">
                  {scanResult.message}
                </p>

                {scanResult.ticket && (
                  <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 text-left border border-white/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-rose-200">Attendee</span>
                      <span className="font-bold text-white text-sm">{scanResult.ticket.attendeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-200">Ticket Code</span>
                      <span className="font-mono font-bold text-white">{scanResult.ticket.ticketCode}</span>
                    </div>
                    {scanResult.ticket.usedAt && (
                      <div className="flex justify-between">
                        <span className="text-rose-200">Scanned Previously</span>
                        <span className="font-bold text-white">{new Date(scanResult.ticket.usedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNextScan}
                  className="mt-8 w-full py-4 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl font-extrabold text-base transition shadow-lg"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}

            {/* AMBER / RED SCREEN: WRONG_EVENT */}
            {scanResult.result === 'WRONG_EVENT' && (
              <div className="bg-amber-600 text-white p-8 sm:p-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-12 h-12 text-white" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-200 block">
                  Gate Mismatch
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-1">
                  WRONG EVENT
                </h2>
                <p className="mt-2 text-sm text-amber-100 font-medium">
                  {scanResult.message}
                </p>

                {scanResult.ticket && (
                  <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 text-left border border-white/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-amber-200">Ticket's Event</span>
                      <span className="font-bold text-white text-sm">{scanResult.ticket.ticketEvent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200">Current Gate</span>
                      <span className="font-bold text-white">{scanResult.ticket.gateEvent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200">Attendee</span>
                      <span className="font-bold text-white">{scanResult.ticket.attendeeName}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNextScan}
                  className="mt-8 w-full py-4 bg-white text-amber-800 hover:bg-amber-50 rounded-2xl font-extrabold text-base transition shadow-lg"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}

            {/* RED SCREEN: INVALID OR FORGED */}
            {(scanResult.result === 'INVALID' || scanResult.result === 'FORBIDDEN') && (
              <div className="bg-red-700 text-white p-8 sm:p-10">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-red-200 block">
                  Fraud Detection
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-1">
                  INVALID TICKET
                </h2>
                <p className="mt-2 text-sm text-red-100 font-medium">
                  {scanResult.message}
                </p>

                <button
                  onClick={handleNextScan}
                  className="mt-8 w-full py-4 bg-white text-red-800 hover:bg-red-50 rounded-2xl font-extrabold text-base transition shadow-lg"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
