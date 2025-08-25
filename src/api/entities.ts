// Mock entities for the application
export class User {
  static async me() {
    return {
      id: '1',
      email: 'user@example.com',
      name: 'John Doe',
    };
  }
}

export class Client {
  static async filter(params: any) {
    return [
      {
        id: '1',
        company_name: 'Hamilton Wise',
        practice_name: 'Hamilton Wise Medical Practice',
        onboarding_completed: true,
        created_by: 'user@example.com',
      }
    ];
  }
}