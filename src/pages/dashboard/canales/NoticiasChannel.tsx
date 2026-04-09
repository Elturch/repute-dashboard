import { Newspaper } from "lucide-react";
import { ChannelPage } from "@/components/ChannelPage";
const NoticiasChannel = () => <ChannelPage channelKey="noticias" channelLabel="Noticias" icon={<Newspaper className="h-6 w-6 text-muted-foreground" />} />;
export default NoticiasChannel;
