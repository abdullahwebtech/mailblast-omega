import random

class RotationManager:
    """Handles logic for routing to clients based on weights and modes."""
    def __init__(self, clients_info: list, mode: str = "round_robin"):
        self.clients_info = clients_info
        self.mode = mode
        self._index = 0

    def get_next_client(self):
        if not self.clients_info:
            return None
            
        if len(self.clients_info) == 1:
            return self.clients_info[0]

        if self.mode == "round_robin":
            client = self.clients_info[self._index % len(self.clients_info)]
            self._index += 1
            return client
            
        elif self.mode == "random":
            # Can add weight logic if dictionary has 'weight'
            return random.choices(
                self.clients_info, 
                weights=[c.get('weight', 1) for c in self.clients_info], 
                k=1
            )[0]
            
        return self.clients_info[0]
