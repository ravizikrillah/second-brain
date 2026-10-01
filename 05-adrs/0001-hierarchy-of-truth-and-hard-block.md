# 0001. Hierarchy of Truth and Mandatory Hard Block

AI agents processing mixed requirements (MoM, BRDs, production code, chat instructions) are vulnerable to gaslighting and contradictory inputs. We enforce a strict 5-tier precedence hierarchy where production code and active DDL outrank signed BRDs, which outrank MoM notes and ad-hoc chat instructions; any contradiction triggers a mandatory Hard Block that halts deliverable generation until human arbitration records an Architectural Decision Record (ADR). This trades automated turnaround speed for uncompromised architectural integrity.
