import Foundation

class NetworkService {
    func fetchData(id: String) -> String {
        print("Fetching data for \(id)...")
        return "Data for \(id)"
    }
}

class DatabaseService {
    func save(data: String) {
        print("Saving \(data) to DB...")
    }
}
