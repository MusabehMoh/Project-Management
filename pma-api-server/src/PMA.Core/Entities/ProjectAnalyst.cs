using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PMA.Core.Entities
{
    public class ProjectAnalyst
    {
        [Key]
        public int Id { get; set; }

        public int ProjectId { get; set; } 

        public Project? Project { get; set; }
        public int AnalystId { get; set; } 
        public Employee? Analyst { get; set; }
    }
}
