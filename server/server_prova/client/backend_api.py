from http.server import BaseHTTPRequestHandler, HTTPServer
import json

from motore_client import send_request_to_motore

HOST = "127.0.0.1"
PORT = 8000


REQUEST_CODES = {
    "PING": "00",
    "ENABLE_BLACKLIST": "01",
    "DISABLE_BLACKLIST": "02",
    "ADD_WHITELIST": "03",
    "REMOVE_WHITELIST": "04",
}


RESPONSE_MESSAGES = {
    "50": "Motore raggiungibile",
    "51": "Blacklist attivata correttamente",
    "52": "Blacklist disattivata correttamente",
    "53": "Dominio aggiunto alla whitelist",
    "54": "Dominio rimosso dalla whitelist",
    "90": "Codice non riconosciuto dal motore",
    "91": "Parametro mancante",
    "99": "Errore interno del motore",
}


class BackendHandler(BaseHTTPRequestHandler):
    """
    Backend HTTP provvisorio.
    Riceve richieste dal frontend e le traduce in codici per il motore.
    """

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def send_json_response(self, status_code, response):
        response_body = json.dumps(response).encode("utf-8")

        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_body)))
        self.send_cors_headers()
        self.end_headers()

        self.wfile.write(response_body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/command":
            self.send_json_response(404, {
                "success": False,
                "message": "Endpoint non trovato"
            })
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            request = json.loads(body)

            action = request.get("action")
            parameter = request.get("parameter")

            if action not in REQUEST_CODES:
                self.send_json_response(400, {
                    "success": False,
                    "message": "Azione non valida"
                })
                return

            request_code = REQUEST_CODES[action]

            response_code = send_request_to_motore(request_code, parameter)
            response_message = RESPONSE_MESSAGES.get(response_code, "Risposta sconosciuta")

            self.send_json_response(200, {
                "success": True,
                "requestCode": request_code,
                "responseCode": response_code,
                "message": response_message
            })

        except ConnectionRefusedError:
            self.send_json_response(500, {
                "success": False,
                "message": "Motore non raggiungibile"
            })

        except Exception as error:
            self.send_json_response(500, {
                "success": False,
                "message": str(error)
            })


def start_backend():
    server = HTTPServer((HOST, PORT), BackendHandler)
    print(f"Backend avviato su http://{HOST}:{PORT}")
    print("Endpoint disponibile: POST /api/command")
    server.serve_forever()


if __name__ == "__main__":
    start_backend()