
-- Tabela para fila de notificações administrativas
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    admin_recipient TEXT DEFAULT 'marivaldotorres@gmail.com',
    dossier_content JSONB, -- Relatório técnico gerado pela IA
    email_body TEXT,      -- Versão formatada para email (HTML)
    is_read BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending_email', -- 'pending_email', 'sent', 'error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para notificações (Apenas admins podem ler)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.is_admin = true
  )
);

CREATE POLICY "Anyone can insert a notification" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (true);

COMMENT ON TABLE public.admin_notifications IS 'Fila de notificações para o administrador sobre novos usuários e dossiês de entrada.';
