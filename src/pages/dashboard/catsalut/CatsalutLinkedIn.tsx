import { FaLinkedin } from 'react-icons/fa6';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_LINKEDIN: CatsalutChannelConfig = {
  canal: 'linkedin',
  titulo: 'LinkedIn — CATSALUT',
  short: 'LinkedIn',
  Icon: FaLinkedin,
  brandColor: '#0A66C2',
};

export default function CatsalutLinkedIn() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_LINKEDIN} />;
}
