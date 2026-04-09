import { MapPin } from "lucide-react";
import { ChannelPage } from "@/components/ChannelPage";
const MyBusinessChannel = () => <ChannelPage channelKey="mybusiness" channelLabel="My Business" icon={<MapPin className="h-6 w-6 text-muted-foreground" />} />;
export default MyBusinessChannel;
