<?php
class SmsService {
    // Estas credenciales te las dará Twilio al crear tu cuenta gratuita
    private $account_sid = 'TU_ACCOUNT_SID_AQUI';
    private $auth_token = 'TU_AUTH_TOKEN_AQUI';
    private $twilio_number = '+1234567890'; // El número que te asignará Twilio

    public function enviarPinSMS($telefono_destino, $pin) {
        // Limpiamos el teléfono por si tiene espacios (ej: "+57 321 456" -> "+57321456")
        $telefono_limpio = str_replace(' ', '', $telefono_destino);

        $url = "https://api.twilio.com/2010-04-01/Accounts/" . $this->account_sid . "/Messages.json";
        
        $datos = [
            'From' => $this->twilio_number,
            'To' => $telefono_limpio,
            'Body' => "Bienvenido a FinanzaPro. Tu código de verificación es: " . $pin
        ];

        // Inicializamos cURL para hacer la petición HTTP POST a la API
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($datos));
        curl_setopt($ch, CURLOPT_USERPWD, $this->account_sid . ':' . $this->auth_token);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FORBID_REUSE, true);
        
        // Ejecutamos y capturamos la respuesta (útil para debug)
        $respuesta = curl_exec($ch);
        $error = curl_error($ch);
        
        if ($error) {
            error_log("Error enviando SMS: " . $error);
            return false;
        }
        
        return true;
    }
}
?>