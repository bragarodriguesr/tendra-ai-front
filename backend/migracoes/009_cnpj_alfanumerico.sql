-- CNPJ alfanumérico (IN RFB nº 2.229/2024): 12 caracteres de raiz e ordem, com letras maiúsculas ou
-- números, e 2 dígitos verificadores numéricos. Os CNPJs só numéricos já gravados continuam válidos.
ALTER TABLE empresas DROP CONSTRAINT empresas_cnpj_check;
ALTER TABLE empresas ADD CONSTRAINT empresas_cnpj_check CHECK (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$');
