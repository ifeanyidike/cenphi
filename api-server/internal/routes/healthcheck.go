package routes

import "net/http"

func (a *Application) HealthCheck(w http.ResponseWriter, r *http.Request) {
	a.Logger.Info("health check endpoint called")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Healthy"))
}
