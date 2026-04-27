import { FaLinkedin } from 'react-icons/fa6';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_LINKEDIN: SermasChannelConfig = {
  canal: 'linkedin',
  titulo: 'LinkedIn — SERMAS',
  short: 'LinkedIn',
  Icon: FaLinkedin,
  brandColor: '#0A66C2',
};

export default function SermasLinkedIn() {
  return <SermasChannelPage cfg={CFG_SERMAS_LINKEDIN} />;
}