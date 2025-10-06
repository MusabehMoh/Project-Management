using System;
using System.Data.SqlClient;

class Program
{
    static void Main(string[] args)
    {
        string connectionString = "Data Source=DESKTOP-88VGRA9;Database=PMA;Integrated Security=True;TrustServerCertificate=True;";
        
        Console.WriteLine("Testing database connection...");
        Console.WriteLine($"Connection String: {connectionString}");
        Console.WriteLine();

        try
        {
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                Console.WriteLine("Opening connection...");
                connection.Open();
                
                Console.WriteLine("✓ Connection successful!");
                Console.WriteLine($"Database: {connection.Database}");
                Console.WriteLine($"Server Version: {connection.ServerVersion}");
                Console.WriteLine($"State: {connection.State}");
                
                // Test a simple query
                Console.WriteLine("\nTesting query execution...");
                using (SqlCommand command = new SqlCommand("SELECT @@VERSION", connection))
                {
                    string version = (string)command.ExecuteScalar();
                    Console.WriteLine($"✓ Query executed successfully!");
                    Console.WriteLine($"SQL Server Version: {version.Split('\n')[0]}");
                }
                
                // List all tables in the database
                Console.WriteLine("\nListing tables in database...");
                using (SqlCommand command = new SqlCommand(
                    "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_SCHEMA, TABLE_NAME", 
                    connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        int count = 0;
                        while (reader.Read())
                        {
                            Console.WriteLine($"  - {reader["TABLE_SCHEMA"]}.{reader["TABLE_NAME"]}");
                            count++;
                        }
                        Console.WriteLine($"\nTotal tables found: {count}");
                    }
                }
                
                connection.Close();
                Console.WriteLine("\n✓ All tests passed! Database is accessible.");
            }
        }
        catch (SqlException ex)
        {
            Console.WriteLine("✗ SQL Error occurred:");
            Console.WriteLine($"Error Number: {ex.Number}");
            Console.WriteLine($"Error Message: {ex.Message}");
            Console.WriteLine($"Server: {ex.Server}");
            Environment.Exit(1);
        }
        catch (Exception ex)
        {
            Console.WriteLine("✗ Error occurred:");
            Console.WriteLine(ex.Message);
            Environment.Exit(1);
        }
    }
}
