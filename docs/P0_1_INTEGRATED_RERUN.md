# P0.1 — Reexecução integrada

A conta administrativa descartável da homologação foi promovida temporariamente na fonte oficial `public.user_access`, com registro em `public.user_access_audit`.

Esta alteração documental dispara novamente o CI usando as mesmas contas descartáveis derivadas de `.github/p0-homologation-trigger.txt`.

Objetivos da reexecução:

- validar Free → Premium;
- validar suspensão;
- validar bloqueio por policy restritiva;
- validar reativação;
- restaurar o atleta descartável para Free/ativo;
- confirmar a trilha em `user_access_audit`.

Nenhuma conta real deve ser modificada.