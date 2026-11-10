/**
 * Quick Send — Continuous Sound Alarm Service
 * Notifies the Super Admin with an urgent, continuous audio signal
 * when an exchange request or confirmation requires review/acceptance.
 * Conforms to Web Audio API standards and background safety.
 */

type AlarmListener = (active: boolean, reason?: string) => void;

class SoundAlarmService {
  private audioContext: AudioContext | null = null;
  private isAlarmRunning: boolean = false;
  private currentReason: string = '';
  private intervalId: number | null = null;
  private listeners: Set<AlarmListener> = new Set();
  private volume: number = 0.5; // 0.0 - 1.0
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    // to comply with browser autoplay security policies
  }

  private initAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  public subscribe(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    listener(this.isAlarmRunning, this.currentReason);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isAlarmRunning, this.currentReason));
  }

  /**
   * Plays a distinct, fintech dual-tone alert chime
   */
  public playAlertChime() {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioContext) return;

      const now = this.audioContext.currentTime;

      // Tone 1: High alert (880 Hz - A5)
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6 ramp

      gain1.gain.setValueAtTime(this.volume * 0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: Secondary urgent pulse (659 Hz - E5)
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(this.volume * 0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Starts a continuous alarm looping until stopped
   */
  public startAlarm(reason: string = 'Operação pendente de aprovação') {
    this.currentReason = reason;
    this.isAlarmRunning = true;
    this.notify();

    // Trigger immediate sound
    this.playAlertChime();

    // Clear existing interval if any
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    // Play continuously every 1.6 seconds until accepted or dismissed
    this.intervalId = window.setInterval(() => {
      if (this.isAlarmRunning) {
        this.playAlertChime();
      } else if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1600);

    // Send browser desktop notification if supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🚨 QUICK SEND — Atenção Admin Requerida', {
          body: reason,
          icon: '/favicon.ico',
          tag: 'quicksend-alarm',
        });
      } catch {
        // Notification error fallback
      }
    }
  }

  /**
   * Stops the continuous alarm
   */
  public stopAlarm() {
    this.isAlarmRunning = false;
    this.currentReason = '';
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.notify();
  }

  /**
   * Temporary mute for user convenience
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public isRunning(): boolean {
    return this.isAlarmRunning;
  }

  public getReason(): string {
    return this.currentReason;
  }

  /**
   * Unlock AudioContext on click
   */
  public unlockAudio() {
    this.initAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Request browser notifications permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
}

export const soundAlarmService = new SoundAlarmService();
