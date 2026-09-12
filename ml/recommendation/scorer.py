from utils.haversine import haversine_km

class RecyclerRecommender:
    def rank(self, lot, recyclers, collector_lat, collector_lng):
        ranked = []
        
        # lot: dict with category, weight_kg
        
        # Find max rate offered for this category among all recyclers
        max_rate = 0
        for r in recyclers:
            rates = r.get('offered_rates', {})
            rate = rates.get(lot['category'], 0)
            if rate > max_rate:
                max_rate = rate
                
        for r in recyclers:
            # Check if recycler accepts the category
            rates = r.get('offered_rates', {})
            if lot['category'] not in rates:
                continue
                
            offered_rate = rates[lot['category']]
            
            # Distance calculation
            r_lat = r.get('latitude', 0)
            r_lng = r.get('longitude', 0)
            distance_km = haversine_km(collector_lat, collector_lng, r_lat, r_lng)
            
            service_area_km = r.get('service_area_km', 20.0) # default 20km
            
            # Scores
            rate_score = (offered_rate / max_rate) if max_rate > 0 else 0
            
            # Clamp distance score
            dist_ratio = distance_km / service_area_km
            distance_score = max(0.0, 1.0 - dist_ratio)
            
            auth_status = r.get('auth_status', 'Active')
            auth_score = 1.0 if auth_status == 'Active' else (0.3 if auth_status == 'Expired' else 0.0)
            
            final_score = 0.5 * rate_score + 0.3 * distance_score + 0.2 * auth_score
            
            ranked.append({
                "recycler_id": r.get('id'),
                "name": r.get('name'),
                "offered_rate": offered_rate,
                "distance_km": round(distance_km, 2),
                "auth_status": auth_status,
                "score": round(final_score, 4)
            })
            
        # Sort descending by score
        ranked.sort(key=lambda x: x['score'], reverse=True)
        return ranked
