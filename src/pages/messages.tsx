import { useState, useRef, useEffect } from "react";
import { 
  useListConversations, 
  useGetMessages, 
  useSendMessage,
  getListConversationsQueryKey,
  getGetMessagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, Send, User } from "lucide-react";
import { format } from "date-fns";

export function Messages() {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(localStorage.getItem("hirerPhone") || "");
  const [activePhone, setActivePhone] = useState(phone);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: isLoadingConvos } = useListConversations(
    { phone: activePhone },
    {
      query: {
        enabled: !!activePhone,
        queryKey: getListConversationsQueryKey({ phone: activePhone })
      }
    }
  );

  const { data: messages, isLoading: isLoadingMessages } = useGetMessages(
    activeConversationId!,
    {
      query: {
        enabled: !!activeConversationId,
        queryKey: getGetMessagesQueryKey(activeConversationId!)
      }
    }
  );

  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSetPhone = () => {
    if (phone) {
      localStorage.setItem("hirerPhone", phone);
      setActivePhone(phone);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !activeConversationId) return;

    sendMessage.mutate({
      id: activeConversationId,
      data: {
        senderPhone: activePhone,
        content: messageContent
      }
    }, {
      onSuccess: () => {
        setMessageContent("");
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(activeConversationId) });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey({ phone: activePhone }) });
      }
    });
  };

  if (!activePhone) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-in fade-in">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Your Messages</h2>
        <p className="text-muted-foreground mb-8">Enter your phone number to view your conversations with laborers.</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <Input 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Your phone number"
            data-testid="input-login-phone"
            onKeyDown={e => e.key === 'Enter' && handleSetPhone()}
          />
          <Button onClick={handleSetPhone} data-testid="btn-login-phone">Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar */}
      <Card className="w-full md:w-80 flex flex-col border-border overflow-hidden shrink-0">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </h2>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingConvos ? (
            <div className="p-4 space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />)}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No conversations yet. Find a laborer to start chatting.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations?.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${activeConversationId === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  data-testid={`conv-item-${conv.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold truncate">{conv.laborerName}</h3>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || "No messages yet"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            Logged in as {activePhone}
            <button onClick={() => { localStorage.removeItem("hirerPhone"); setActivePhone(""); }} className="text-primary hover:underline">Change</button>
          </p>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 hidden md:flex flex-col border-border overflow-hidden bg-card relative">
        {activeConversationId ? (
          <>
            <div className="p-4 border-b border-border bg-background shadow-sm z-10 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {conversations?.find(c => c.id === activeConversationId)?.laborerName}
              </h3>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10"
            >
              {isLoadingMessages ? (
                <div className="flex justify-center p-4"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
              ) : messages?.map(msg => {
                const isMe = msg.senderPhone === activePhone;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm shadow-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right opacity-70`}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-background border-t border-border">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted/30 focus-visible:bg-background"
                  data-testid="input-message"
                />
                <Button 
                  type="submit" 
                  disabled={!messageContent.trim() || sendMessage.isPending}
                  size="icon"
                  className="shrink-0 rounded-full"
                  data-testid="btn-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}