import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { BiNews } from 'react-icons/bi';
import type { IconType } from 'react-icons';
import type { Canal } from '@/hooks/useCanalData';

export interface CanalCfg { key: Canal; label: string; Icon: IconType; brandColor: string }

export const CANALES: CanalCfg[] = [
  { key: 'medios', label: 'Medios', Icon: BiNews, brandColor: 'hsl(var(--muted-foreground))' },
  { key: 'instagram', label: 'Instagram', Icon: SiInstagram, brandColor: '#E4405F' },
  { key: 'twitter', label: 'X (Twitter)', Icon: FaXTwitter, brandColor: 'hsl(var(--foreground))' },
  { key: 'tiktok', label: 'TikTok', Icon: SiTiktok, brandColor: 'hsl(var(--foreground))' },
  { key: 'facebook', label: 'Facebook', Icon: SiFacebook, brandColor: '#1877F2' },
  { key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedin, brandColor: '#0A66C2' },
  { key: 'mybusiness', label: 'Reseñas Google', Icon: SiGoogle, brandColor: '#4285F4' },
];
