package contracts

type ReviewerData struct {
	Name       string `json:"name"`
	ExternalID string `json:"id"`
	Email      string `json:"email"`
}
