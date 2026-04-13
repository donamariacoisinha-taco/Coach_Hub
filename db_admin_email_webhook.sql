
-- 1. FUNÇÃO QUE CHAMA O WEBHOOK (Placeholder para Edge Function ou Serviço Externo)
-- Esta função é disparada quando uma nova linha entra em 'admin_notifications'
CREATE OR REPLACE FUNCTION public.trigger_admin_email_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Aqui você pode configurar o Supabase para chamar uma Edge Function 
  -- que faça o envio real de e-mail usando Resend, SendGrid ou Mailgun.
  
  -- Exemplo conceitual de chamada HTTP se o Vault/HTTP extension estiver ativo:
  -- PERFORM http_post('https://sua-edge-function.supabase.co/functions/v1/send-admin-email', 
  --   json_build_object('notification_id', NEW.id)::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER NO BANCO
DROP TRIGGER IF EXISTS tr_send_admin_email ON public.admin_notifications;
CREATE TRIGGER tr_send_admin_email
AFTER INSERT ON public.admin_notifications
FOR EACH ROW EXECUTE PROCEDURE public.trigger_admin_email_webhook();

COMMENT ON FUNCTION public.trigger_admin_email_webhook IS 'Gatilho para iniciar o processo de envio de e-mail administrativo via Edge Functions.';
