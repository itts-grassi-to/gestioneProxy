import subprocess
class FZ:
    def __init__(self,sito_block,squid_conf,exam,ori):
        self.__sito_block=sito_block
        self.__squid_conf=squid_conf
        self.__ori = ori
        self.__exam = exam
        #self.__normal = normal
    def getStatus(self):
        with open(self.__squid_conf, "r", encoding="utf-8") as file:
            prima_riga = file.readline()
            if self.__sito_block in prima_riga:
                #print("Trovato!")
                return True
            else:
                #print("Non trovato.")        
                return False
    def start(self):
        if self.esegui_comando(f"cp {self.__exam} {self.__squid_conf}"):
            return self.restart_squid_service()
        return False 
    def stop(self):
        if self.esegui_comando(f"cp {self.__ori} {self.__squid_conf}"):
            return self.restart_squid_service()
        return False 
    def esegui_comando(self, comando: str) -> bool:
        try:
            # shell=True permette di passare il comando come stringa da terminale
            # capture_output=True e text=True salvano output ed errori come testo
            risultato = subprocess.run(
                comando, shell=True, capture_output=True, text=True
            )

            if risultato.returncode == 0:
                print(f"✅ Comando eseguito con successo: '{comando}'")
                return True
            if risultato.stdout:
                print("Output:", risultato.stdout.strip())
                return True
            else:
                print(f"❌ Errore nell'esecuzione del comando: '{comando}'")
                if risultato.stderr:
                    print("Dettaglio errore:", risultato.stderr.strip())
                return False

        except Exception as e:
            print(f"❌ Si è verificata un'eccezione: {e}")
            return False
    def restart_squid_service(self) -> bool:
        """Riavvia il servizio Squid tramite systemctl."""
        command = ["systemctl", "restart", "squid.service"]

        try:
            # Esegue il comando.
            # check=True solleva un'eccezione CalledProcessError se il comando fallisce.
            # capture_output=True cattura stdout e stderr.
            # text=True restituisce l'output come stringa invece di byte.
            result = subprocess.run(
                command, check=True, capture_output=True, text=True
            )

            print("Servizio Squid riavviato con successo.")
            if result.stdout:
                print(f"Output: {result.stdout.strip()}")
            return True 
        except subprocess.CalledProcessError as e:
            print(
                f"Errore durante il riavvio di Squid (codice di uscita {e.returncode}):"
            )
            if e.stderr:
                print(f"Dettagli errore: {e.stderr.strip()}")
            return False
        except FileNotFoundError:
            print("Errore: Il comando 'systemctl' non è stato trovato nel sistema.")
            return False
        except Exception as e:
            print(f"Errore imprevisto: {e}")
            return False