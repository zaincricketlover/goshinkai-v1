import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, Sparkles } from 'lucide-react';

interface MessageInputProps {
    onSend: (text: string, isTemplate: boolean) => Promise<void>;
}

const TEMPLATES = [
    "はじめまして！プロフィールを拝見し、ご連絡させていただきました。",
    "先日のイベントではありがとうございました！",
    "ぜひ一度、情報交換のお時間をいただけないでしょうか？",
    "ご紹介いただいた件について、詳細を伺いたいです。",
    "今度、御社のオフィスに伺ってもよろしいでしょうか？"
];

export const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    const handleSend = async () => {
        if (!text.trim()) return;
        setLoading(true);
        await onSend(text, false);
        setText('');
        setLoading(false);
        setShowTemplates(false);
    };

    const handleTemplateClick = (template: string) => {
        setText(template);
        setShowTemplates(false);
    };

    return (
        <div className="border-t border-white/10 bg-surface/90 backdrop-blur-lg p-4 pb-safe">
            {/* Template Selector */}
            {showTemplates && (
                <div className="mb-4 overflow-x-auto flex gap-2 pb-2 scrollbar-hide">
                    {TEMPLATES.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => handleTemplateClick(t)}
                            className="flex-shrink-0 bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap max-w-[200px] truncate"
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`p-2 rounded-full transition-colors ${showTemplates ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sparkles className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-surface-elevated rounded-xl border border-white/10 focus-within:ring-1 focus-within:ring-accent transition-all">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="w-full bg-transparent text-white px-3 py-2 text-sm focus:outline-none resize-none max-h-32 min-h-[40px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                </div>

                <Button
                    variant="gold"
                    size="sm"
                    onClick={handleSend}
                    disabled={!text.trim() || loading}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </div>
        </div>
    );
};
