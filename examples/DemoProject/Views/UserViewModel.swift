import Foundation

class UserViewModel: ObservableObject {
    private let network = NetworkService()
    private let db = DatabaseService()
    
    @Published var userName: String = ""
    
    func refreshUser() {
        let data = network.fetchData(id: "user_123")
        db.save(data: data)
        self.userName = data
    }
    
    func reset() {
        self.userName = ""
    }
}
